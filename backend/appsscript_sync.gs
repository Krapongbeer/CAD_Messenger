// ========================================================================
//  SmartCAD-Messenger: Google Apps Script Webhook Backend
//  กองบริหารงานกลาง สำนักงานมหาวิทยาลัยเชียงใหม่ (CMU)
// ========================================================================

const WEBHOOK_SECRET = "my_super_secret_token_334477552266";
const SUPABASE_URL = "https://chtxxyrupftpoiooggvh.supabase.co";
// ใส่ SUPABASE_SERVICE_ROLE_KEY ใน Script Properties ของ Apps Script เพื่อความปลอดภัยสูงสุด

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e ? (e.parameter || {}) : {};
    const secret = params.secret || "";
    
    if (secret !== WEBHOOK_SECRET) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unauthorized: Invalid Secret" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = params.action || "sync";
    
    if (action === "approve" || action === "reset_password") {
      const email = params.identifier || "";
      const tempPass = params.temp_password || "";
      const fullname = params.fullname || email;
      
      if (email && tempPass) {
        sendPasswordEmail(email, fullname, tempPass, action);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", action: action, email: email }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "register_user") {
      const email = params.email || "";
      const fullname = params.fullname || email;
      const username = params.username || "";
      const department = params.department || "";
      
      sendRegisterNotificationEmail(email, fullname, username, department);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", action: action, email: email }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "Webhook processed" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendPasswordEmail(email, fullname, tempPass, action) {
  const subject = action === "approve"
    ? "🎉 บัญชีของท่านได้รับการอนุมัติใช้งานแล้ว - SmartCAD-Messenger (กองบริหารงานกลาง CMU)"
    : "🔑 แจ้งการรีเซ็ตรหัสผ่านใหม่ - SmartCAD-Messenger (กองบริหารงานกลาง CMU)";

  const htmlBody = `
    <div style="font-family:'Prompt',sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
      <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #5c2483">
        <h2 style="color:#5c2483;margin:0">SmartCAD<span style="color:#e09f19">-Messenger</span></h2>
        <p style="color:#64748b;font-size:12px;margin-top:4px">กองบริหารงานกลาง สำนักงานมหาวิทยาลัยเชียงใหม่</p>
      </div>
      <div style="padding:20px 0;color:#334155;line-height:1.6">
        <p>เรียน คุณ <strong>${fullname}</strong>,</p>
        <p>${action === "approve" ? "บัญชีผู้ใช้งานของท่านได้รับการอนุมัติจากผู้ดูแลระบบเรียบร้อยแล้ว" : "ระบบได้ดำเนินการรีเซ็ตรหัสผ่านใหม่ให้แก่บัญชีของท่านเรียบร้อยแล้ว"} โดยมีรายละเอียดรหัสผ่านชั่วคราวในการเข้าใช้งานดังนี้:</p>
        <div style="background:#fff;padding:16px;border-radius:8px;border:1.5px dashed #5c2483;text-align:center;margin:20px 0">
          <div style="font-size:12px;color:#64748b;margin-bottom:4px">รหัสผ่านชั่วคราว (Temporary Password)</div>
          <div style="font-size:24px;font-weight:700;color:#5c2483;letter-spacing:2px">${tempPass}</div>
        </div>
        <p style="font-size:13px;color:#d97706">⚠️ หมายเหตุ: เพื่อความปลอดภัย ระบบจะบังคับให้ท่านเปลี่ยนรหัสผ่านใหม่ทันทีเมื่อเข้าสู่ระบบครั้งแรก</p>
      </div>
      <div style="text-align:center;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8">
        อีเมลนี้เป็นระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

function sendRegisterNotificationEmail(email, fullname, username, department) {
  // ฟังก์ชันส่งอีเมลแจ้งเตือนลงทะเบียนใหม่
}
