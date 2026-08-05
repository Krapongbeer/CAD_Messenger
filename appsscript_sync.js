/**
 * ========================================================================
 *  SmartCAD Messenger - Google Apps Script (appsscript_sync.js)
 *  100% Fixed & Robust Auto Sync Engine (Strict Column Filtering)
 * ========================================================================
 */

function getCleanProperty(name) {
  try {
    const prop = PropertiesService.getScriptProperties().getProperty(name);
    if (!prop || prop.trim() === "" || prop.trim() === "null" || prop.includes("YOUR_")) return null;
    return prop.trim();
  } catch (e) {
    return null;
  }
}

const SUPABASE_URL = getCleanProperty('SUPABASE_URL') || "https://chtxxyrupftpoiooggvh.supabase.co";
const SUPABASE_KEY = getCleanProperty('SUPABASE_SERVICE_ROLE_KEY') || "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE";
const WEBHOOK_SECRET = getCleanProperty('WEBHOOK_SECRET') || "my_super_secret_token_334477552266";

const SHEET_NAME = "Messenger";
const TZ = "Asia/Bangkok";
const SPREADSHEET_ID = "1LaB9y7mVULEvA4nLewxAGzOLzi0rbKcwoOQXF55ZiDs";

function getSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getDataSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet) return sheet;
  
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const s = sheets[i];
    if (s.getLastColumn() > 0) {
      const vals = s.getRange(1, 1, 1, Math.min(15, s.getLastColumn())).getValues();
      if (vals.length > 0) {
        const hStr = vals[0].join(" ").toLowerCase();
        if (hStr.includes("tracking") || hStr.includes("sender") || hStr.includes("receiver") || hStr.includes("detail")) {
          return s;
        }
      }
    }
  }
  return sheets[0];
}

function onChange(e) { syncUnsyncedRows(); }
function onEdit(e) { syncUnsyncedRows(); }

function setupAutoTrigger() {
  const ss = getSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('syncUnsyncedRows').forSpreadsheet(ss).onChange().create();
  ScriptApp.newTrigger('syncUnsyncedRows').timeBased().everyMinutes(1).create();

  Logger.log("✅ Auto triggers set up successfully!");
}

function syncUnsyncedRows() {
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY.includes("YOUR_")) return 0;
  
  try {
    const ss = getSpreadsheet();
    let sheet = getDataSheet(ss);
    if (!sheet) return 0;
    
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return 0;
    
    const headers = values[0].map(h => String(h).trim());
    
    let trackingColIdx = headers.findIndex(h => {
      const k = h.toLowerCase().replace(/[\s\W_]+/g, "");
      return k === "trackingno" || k === "jobid" || k === "tracking" || k === "jobno";
    });
    if (trackingColIdx === -1) trackingColIdx = 2;
    
    let signatureColIdx = headers.findIndex(h => {
      const k = h.toLowerCase();
      return k.includes("signature") || k.includes("ลายเซ็น");
    });
    
    let syncedColIdx = headers.findIndex(h => h.toLowerCase().trim() === "synced");
    if (syncedColIdx === -1) {
      syncedColIdx = headers.length;
      sheet.getRange(1, syncedColIdx + 1).setValue("Synced");
    }
    
    let recordsToSync = [];
    let rowsToUpdate = [];
    
    let syncedColumnValues = [];
    for (let i = 1; i < values.length; i++) {
      let currentVal = String(values[i][syncedColIdx] || "").trim().toUpperCase();
      syncedColumnValues.push([currentVal]);
    }
    
    const validDbColumns = ["tracking_no", "date", "sender", "receiver", "status", "detail", "signature", "record_by_email", "timestamp"];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const syncedVal = String(row[syncedColIdx] || "").trim().toUpperCase();
      if (!row[trackingColIdx] || String(row[trackingColIdx]).trim() === "") continue;
      
      const hasSignature = signatureColIdx !== -1 && String(row[signatureColIdx] || "").trim() !== "";
      let shouldSync = false;
      let targetSyncState = "Y";
      
      if (hasSignature) {
        if (syncedVal !== "Y_SIGNED") {
          shouldSync = true;
          targetSyncState = "Y_SIGNED";
        }
      } else {
        if (syncedVal !== "Y" && syncedVal !== "Y_SIGNED") {
          shouldSync = true;
          targetSyncState = "Y";
        }
      }
      
      if (shouldSync) {
        let record = {};
        headers.forEach((header, idx) => {
          if (header && header.toLowerCase().trim() !== "synced") {
            let dbKey = mapHeaderToDb(header);
            if (validDbColumns.indexOf(dbKey) !== -1) {
              let val = row[idx];
              
              if (val instanceof Date) {
                if (dbKey === "date") {
                  val = Utilities.formatDate(val, TZ, "yyyy-MM-dd");
                } else {
                  val = Utilities.formatDate(val, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
                }
              } else if (typeof val === "string" && val.trim() !== "") {
                if (dbKey === "date" && val.includes("T")) {
                  val = val.split("T")[0];
                }
              }
              record[dbKey] = val;
            }
          }
        });
        
        record["status"] = hasSignature ? "สำเร็จ" : "รอดำเนินการ";
        recordsToSync.push(record);
        rowsToUpdate.push({ rowOffset: i - 1, state: targetSyncState });
      }
    }
    
    if (recordsToSync.length === 0) return 0;
    
    Logger.log(`Found ${recordsToSync.length} unsynced rows. Posting valid columns to Supabase...`);
    
    const url = `${SUPABASE_URL}/rest/v1/records`;
    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates"
      },
      payload: JSON.stringify(recordsToSync),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    
    if (code >= 200 && code < 300) {
      rowsToUpdate.forEach(item => {
        syncedColumnValues[item.rowOffset][0] = item.state;
      });
      
      sheet.getRange(2, syncedColIdx + 1, syncedColumnValues.length, 1).setValues(syncedColumnValues);
      SpreadsheetApp.flush();
      Logger.log(`Successfully batch synced ${recordsToSync.length} records!`);
      return recordsToSync.length;
    } else {
      Logger.log(`Supabase batch error (${code}): ` + response.getContentText());
      return 0;
    }
    
  } catch (err) {
    Logger.log("Sync error: " + err.toString());
    return 0;
  }
}

function mapHeaderToDb(header) {
  const map = {
    "Tracking_NO": "tracking_no",
    "Job_ID": "tracking_no",
    "Job_Id": "tracking_no",
    "Job ID": "tracking_no",
    "Date": "date",
    "Sender": "sender",
    "Receiver": "receiver",
    "Status": "status",
    "Detail": "detail",
    "Signature": "signature",
    "Record_By": "record_by_email",
    "Timestamp": "timestamp"
  };
  const cleanH = header.trim();
  if (map[cleanH]) return map[cleanH];
  
  const lower = cleanH.toLowerCase().replace(/[\s\W_]+/g, "");
  if (lower === "trackingno" || lower === "jobid" || lower === "jobno" || lower === "tracking") return "tracking_no";
  if (lower === "recordby" || lower === "recordbyemail") return "record_by_email";
  
  return cleanH.toLowerCase().replace(/[\s\W]+/g, "_");
}

function doGet(e) {
  try {
    const result = syncUnsyncedRows();
    return jsonOut({ status: "ok", message: "Batch sync executed successfully", synced: result || 0 });
  } catch (err) {
    return jsonOut({ status: "error", message: err.toString() }, 500);
  }
}

function doPost(e) {
  try {
    let headerToken = "";
    if (e && e.parameter && e.parameter.secret) headerToken = e.parameter.secret;
    else if (e && e.headers && e.headers["x-webhook-secret"]) headerToken = e.headers["x-webhook-secret"];
    
    if (WEBHOOK_SECRET && headerToken !== WEBHOOK_SECRET)
      return jsonOut({ status: "error", message: "Unauthorized" }, 401);
    
    const payload = JSON.parse(e.postData.contents);
    const user = payload.user;
    if (!user || !user.email) return jsonOut({ status: "error", message: "Missing email" }, 400);
    
    if (payload.action === "approve" || payload.action === "reset_password") {
      const tempPass = generateNistTempPassword();
      const success = updateSupabaseUserPassword(user.id, tempPass);
      if (!success) return jsonOut({ status: "error", message: "Failed to update password" }, 500);
      
      const mailSubject = payload.action === "approve" 
        ? "[CAD-Messenger] อนุมัติการใช้งานและรหัสผ่านชั่วคราว" 
        : "[CAD-Messenger] รีเซ็ตรหัสผ่านโดยผู้ดูแลระบบ";
      const mailBody = `เรียนคุณ ${user.fullname || user.email},\n\nระบบได้ดำเนินการเรียบร้อยแล้ว\n\n• Email: ${user.email}\n• รหัสผ่านชั่วคราว: ${tempPass}\n\nกรุณาเข้าสู่ระบบและเปลี่ยนรหัสผ่านใหม่ทันที\n\nทีมงาน CAD-Messenger`;
      sendEmail(user.email, mailSubject, mailBody);
      return jsonOut({ status: "ok", message: `Successfully generated password` });
    }
    return jsonOut({ status: "error", message: "Unknown action" }, 400);
  } catch (err) {
    return jsonOut({ status: "error", message: err.toString() }, 500);
  }
}

function updateSupabaseUserPassword(userId, password) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${userId}`;
  const options = {
    method: "put", contentType: "application/json",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    payload: JSON.stringify({ password: password }), muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    updateProfileForceChangePass(userId);
    return true;
  }
  return false;
}

function updateProfileForceChangePass(userId) {
  const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
  UrlFetchApp.fetch(url, {
    method: "patch", contentType: "application/json",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    payload: JSON.stringify({ force_change_password: true, status: "active" }), muteHttpExceptions: true
  });
}

function generateNistTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#@!";
  let pass = "";
  for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  return pass;
}

function sendEmail(to, subject, body) {
  try { GmailApp.sendEmail(to, subject, body); } catch (e) { MailApp.sendEmail(to, subject, body); }
}

function jsonOut(obj, statusCode = 200) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
