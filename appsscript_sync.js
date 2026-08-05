/**
 * ========================================================================
 *  SmartCAD Messenger - Google Apps Script (appsscript_sync.js)
 *  Secure Background Sync & Webhook Controller (100% Free)
 * ========================================================================
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheet -> Extensions -> Apps Script.
 * 2. Paste this code.
 * 3. Go to Project Settings (Gear icon) -> Script Properties.
 * 4. Add the following properties:
 *    - SUPABASE_URL: (Your Supabase Project URL)
 *    - SUPABASE_SERVICE_ROLE_KEY: (Your Supabase service_role key - KEEP SECRET)
 *    - WEBHOOK_SECRET: (Set a random string, e.g., "my_super_secret_token_123")
 * 5. Add a column named "Synced" at the very end of your Google Sheet.
 * 6. Set up triggers (Clock icon):
 *    - Add trigger for "syncUnsyncedRows" -> Time-driven -> Every 1 minute (or on Change).
 * 7. Deploy as Web App:
 *    - Deploy -> New Deployment -> Web App.
 *    - Execute as: Me.
 *    - Who has access: Anyone.
 *    - Copy the deployment URL (use this in Supabase Webhook).
 */

function getCleanProperty(name) {
  try {
    const prop = PropertiesService.getScriptProperties().getProperty(name);
    if (!prop || prop.trim() === "" || prop.trim() === "null") return null;
    return prop.trim();
  } catch (e) {
    return null;
  }
}

const SUPABASE_URL = getCleanProperty('SUPABASE_URL') || "https://chtxxyrupftpoiooggvh.supabase.co";
const SUPABASE_KEY = getCleanProperty('SUPABASE_SERVICE_ROLE_KEY') || "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE";
const WEBHOOK_SECRET = getCleanProperty('WEBHOOK_SECRET') || "my_super_secret_token_334477552266";

const SHEET_NAME = "Messenger"; // Name of your AppSheet data sheet
const TZ = "Asia/Bangkok";
const SPREADSHEET_ID = "1LaB9y7mVULEvA4nLewxAGzOLzi0rbKcwoOQXF55ZiDs";

function getSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ========================================================================
//  1. SYNC SHEET DATA TO SUPABASE (100% AUTOMATIC FROM APPSHEET)
// ========================================================================

/**
 * AUTO TRIGGERS: Fires automatically when AppSheet mobile user submits a row
 */
function onChange(e) {
  syncUnsyncedRows();
}

function onEdit(e) {
  syncUnsyncedRows();
}

/**
 * ⚡ RUN THIS ONCE in Google Apps Script editor to set up 100% AUTOMATIC triggers!
 */
function setupAutoTrigger() {
  const ss = getSpreadsheet();
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));

  // 1. Instant trigger when AppSheet mobile user submits data
  ScriptApp.newTrigger('syncUnsyncedRows')
    .forSpreadsheet(ss)
    .onChange()
    .create();

  // 2. Backup trigger every 1 minute
  ScriptApp.newTrigger('syncUnsyncedRows')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log("✅ Auto triggers set up successfully!");
}

function syncUnsyncedRows() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    Logger.log("Missing Supabase configuration properties!");
    return;
  }
  
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    if (!sheet) {
      Logger.log("Sheet not found: " + SHEET_NAME);
      return;
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    if (values.length < 2) return; // Only headers present
    
    const headers = values[0].map(h => String(h).trim());
    let syncedColIdx = headers.indexOf("Synced");
    const trackingColIdx = headers.indexOf("Tracking_NO");
    
    // Auto-create "Synced" column at the end if missing
    if (syncedColIdx === -1) {
      syncedColIdx = headers.length;
      sheet.getRange(1, syncedColIdx + 1).setValue("Synced");
    }
    
    const signatureColIdx = headers.indexOf("Signature");
    
    let recordsToSync = [];
    let rowIndices = [];
    let rowSyncStates = [];
    
    // Scan sheet rows (start at index 1 for row 2)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const syncedVal = String(row[syncedColIdx]).trim().toUpperCase();
      
      if (!row[trackingColIdx]) continue;
      
      const hasSignature = signatureColIdx !== -1 && String(row[signatureColIdx]).trim() !== "";
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
          if (header && header !== "Synced") {
            let val = row[idx];
            // Format dates/timestamps to ISO string for Postgres
            if (val instanceof Date) {
              val = Utilities.formatDate(val, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
            }
            record[mapHeaderToDb(header)] = val;
          }
        });
        
        // Explicitly map status based on signature presence
        record["status"] = hasSignature ? "สำเร็จ" : "รอดำเนินการ";
        
        recordsToSync.push(record);
        rowIndices.push(i + 1); // Store 1-based row index
        rowSyncStates.push(targetSyncState);
      }
    }
    
    if (recordsToSync.length === 0) return;
    
    Logger.log(`Found ${recordsToSync.length} unsynced rows. Syncing...`);
    
    // Post to Supabase REST API
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
      Logger.log("Sync successful. Marking rows in sheet...");
      // Mark as synced in sheet
      rowIndices.forEach((rowIdx, idx) => {
        sheet.getRange(rowIdx, syncedColIdx + 1).setValue(rowSyncStates[idx]);
      });
      SpreadsheetApp.flush();
      return recordsToSync.length;
    } else {
      Logger.log(`Supabase error (${code}): ` + response.getContentText());
      return 0;
    }
    
  } catch (err) {
    Logger.log("Sync error: " + err.toString());
  }
}

// Map Google Sheet Header name to Database table column name
function mapHeaderToDb(header) {
  const map = {
    "Tracking_NO": "tracking_no",
    "Date": "date",
    "Sender": "sender",
    "Receiver": "receiver",
    "Status": "status",
    "Detail": "detail",
    "Signature": "signature",
    "Record_By": "record_by_email",
    "Timestamp": "timestamp"
  };
  return map[header] || header.toLowerCase().replace(/[\s\W]+/g, "_");
}


function doGet(e) {
  try {
    const result = syncUnsyncedRows();
    return jsonOut({ status: "ok", message: "Sheet sync executed successfully", synced: result || 0 });
  } catch (err) {
    return jsonOut({ status: "error", message: err.toString() }, 500);
  }
}

function doPost(e) {
  try {
    let headerToken = "";
    if (e && e.parameter && e.parameter.secret) {
      headerToken = e.parameter.secret;
    } else if (e && e.headers && e.headers["x-webhook-secret"]) {
      headerToken = e.headers["x-webhook-secret"];
    }
    
    if (WEBHOOK_SECRET && headerToken !== WEBHOOK_SECRET) {
      return jsonOut({ status: "error", message: "Unauthorized webhook caller" }, 401);
    }
    
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action; // e.g. "approve" or "reset_password"
    const user = payload.user; // Contains id, email, fullname
    
    if (!user || !user.email) {
      return jsonOut({ status: "error", message: "Missing user email" }, 400);
    }
    
    if (action === "approve" || action === "reset_password") {
      const tempPass = generateNistTempPassword();
      
      // Update password in Supabase Auth Admin API
      const success = updateSupabaseUserPassword(user.id, tempPass);
      if (!success) {
        return jsonOut({ status: "error", message: "Failed to update user password in Supabase Auth" }, 500);
      }
      
      // Send Email to User
      const mailSubject = action === "approve" 
        ? "[CAD-Messenger] อนุมัติการใช้งานและรหัสผ่านชั่วคราว" 
        : "[CAD-Messenger] รีเซ็ตรหัสผ่านโดยผู้ดูแลระบบ";
        
      const mailBody = `เรียนคุณ ${user.fullname || user.email},\n\n`
        + `ระบบได้ดำเนินการ ${action === "approve" ? "อนุมัติการใช้งานบัญชี" : "รีเซ็ตรหัสผ่าน"} ของท่านเรียบร้อยแล้ว\n\n`
        + `• บัญชีผู้ใช้งาน (Email): ${user.email}\n`
        + `• รหัสผ่านชั่วคราว (Temporary Password): ${tempPass}\n\n`
        + `กรุณานำรหัสผ่านชั่วคราวนี้ไปเข้าใช้งานระบบ และระบบจะบังคับให้ท่านเปลี่ยนรหัสผ่านใหม่ทันทีเมื่อเข้าสู่ระบบครั้งแรก\n\n`
        + `ขอแสดงความนับถือ,\n`
        + `ทีมงาน CAD-Messenger`;
        
      sendEmail(user.email, mailSubject, mailBody);
      
      return jsonOut({ status: "ok", message: `Successfully generated password and sent email to ${user.email}` });
    }
    
    return jsonOut({ status: "error", message: `Unknown action: ${action}` }, 400);
    
  } catch (err) {
    return jsonOut({ status: "error", message: err.toString() }, 500);
  }
}

// Updates a user's password in Supabase Auth database via Admin API
function updateSupabaseUserPassword(userId, password) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${userId}`;
  const options = {
    method: "put",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    },
    payload: JSON.stringify({ password: password }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  
  if (code === 200) {
    // Also update force_change_password in profiles table to true
    updateProfileForceChangePass(userId);
    return true;
  }
  Logger.log(`Failed to update Auth password: ` + response.getContentText());
  return false;
}

function updateProfileForceChangePass(userId) {
  const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
  const options = {
    method: "patch",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    },
    payload: JSON.stringify({ force_change_password: true, status: "active" }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(url, options);

  // Update app_metadata in Auth table as well
  const authUrl = `${SUPABASE_URL}/auth/v1/admin/users/${userId}`;
  const authOptions = {
    method: "put",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    },
    payload: JSON.stringify({
      app_metadata: { status: "active" }
    }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(authUrl, authOptions);
}

// Generate secure 10-character temporary password conforming to NIST guidelines
function generateNistTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#@!$%&*+";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    pass += chars.charAt(idx);
  }
  return pass;
}

function sendEmail(to, subject, body) {
  try {
    GmailApp.sendEmail(to, subject, body);
  } catch (e) {
    MailApp.sendEmail(to, subject, body);
  }
}

function jsonOut(obj, statusCode = 200) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
