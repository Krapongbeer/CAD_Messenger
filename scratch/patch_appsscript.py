import re

with open("/Users/krapong/Documents/AntiGravity/smart-cad-messenger+supabase/appsscript_sync.js", "r") as f:
    content = f.read()

# Replace sendEmail definition
old_send_email = """function sendEmail(to, subject, body) {
  try {
    GmailApp.sendEmail(to, subject, body, {
      name: "SmartCAD Messenger"
    });
  } catch (e) {
    try {
      MailApp.sendEmail(to, subject, body, {
        name: "SmartCAD Messenger"
      });
    } catch (err) {
      Logger.log("❌ sendEmail error: " + err.toString());
    }
  }
}"""
new_send_email = """function sendEmail(to, subject, body, htmlBody) {
  try {
    GmailApp.sendEmail(to, subject, body, {
      name: "SmartCAD Messenger",
      htmlBody: htmlBody || body.replace(/\\n/g, "<br>")
    });
  } catch (e) {
    try {
      MailApp.sendEmail(to, subject, body, {
        name: "SmartCAD Messenger",
        htmlBody: htmlBody || body.replace(/\\n/g, "<br>")
      });
    } catch (err) {
      Logger.log("❌ sendEmail error: " + err.toString());
    }
  }
}"""
content = content.replace(old_send_email, new_send_email)

# Replace create_and_approve email
old_ca_email = """      const mailSubject = "[SmartCAD Messenger] บัญชีผู้ใช้งานใหม่และรหัสผ่านชั่วคราว";
      const mailBody = `เรียน คุณ${fullname},\\n\\nระบบ SmartCAD Messenger ได้ดำเนินการสร้างบัญชีและตั้งค่ารหัสผ่านชั่วคราวให้ท่านเรียบร้อยแล้ว\\n\\n• บัญชีผู้ใช้ (Email): ${email}\\n• รหัสผ่านชั่วคราว: ${tempPass}\\n• ลิงก์เข้าใช้งาน: https://krapongbeer.github.io/CAD_Messenger/\\n\\nกรุณานำรหัสผ่านชั่วคราวข้างต้นไปเข้าสู่ระบบเพื่อตั้งรหัสผ่านใหม่ของท่านทันที\\n\\n------------------------------------------\\nติดต่อสอบถามเพิ่มเติมได้ที่:\\nทีมงานพัฒนาระบบ SmartCAD Messenger\\nกองบริหารงานกลาง สำนักงานมหาวิทยาลัย มหาวิทยาลัยเชียงใหม่\\nโทรศัพท์: 053-943011-14\\nอีเมล: saraban@cmu.ac.th`;

      sendEmail(email, mailSubject, mailBody);"""
new_ca_email = """      const mailSubject = "[SmartCAD Messenger] บัญชีผู้ใช้งานใหม่และรหัสผ่านชั่วคราว";
      const mailBody = `เรียน คุณ${fullname},\\n\\nระบบ SmartCAD Messenger ได้ดำเนินการสร้างบัญชีและตั้งค่ารหัสผ่านชั่วคราวให้ท่านเรียบร้อยแล้ว\\n\\n• บัญชีผู้ใช้ (Email): ${email}\\n• รหัสผ่านชั่วคราว: ${tempPass}\\n• ลิงก์เข้าใช้งาน: https://krapongbeer.github.io/CAD_Messenger/\\n\\nกรุณานำรหัสผ่านชั่วคราวข้างต้นไปเข้าสู่ระบบเพื่อตั้งรหัสผ่านใหม่ของท่านทันที\\n\\n------------------------------------------\\nติดต่อสอบถามเพิ่มเติมได้ที่:\\nทีมงานพัฒนาระบบ SmartCAD Messenger\\nกองบริหารงานกลาง สำนักงานมหาวิทยาลัย มหาวิทยาลัยเชียงใหม่\\nโทรศัพท์: 053-943011-14\\nอีเมล: saraban@cmu.ac.th`;
      
      const htmlBody = `
      <div style="font-family: 'Sarabun', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9fb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #3b1359 0%, #5c2483 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SmartCAD Messenger</h1>
          <p style="color: #e09f19; margin: 5px 0 0 0; font-size: 14px;">กองบริหารงานกลาง สำนักงานมหาวิทยาลัย</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #333333; font-size: 16px; margin-top: 0;">เรียน <strong>คุณ${fullname}</strong>,</p>
          <p style="color: #555555; font-size: 15px; line-height: 1.6;">ระบบ SmartCAD Messenger ได้ดำเนินการสร้างบัญชีและตั้งค่ารหัสผ่านชั่วคราวให้ท่านเรียบร้อยแล้ว</p>
          
          <div style="background-color: #ffffff; border-left: 4px solid #9d4edd; padding: 20px; margin: 25px 0; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
            <p style="margin: 0 0 10px 0; color: #555555; font-size: 15px;"><strong>บัญชีผู้ใช้ (Email):</strong> <span style="color: #3b1359;">${email}</span></p>
            <p style="margin: 0; color: #555555; font-size: 15px;"><strong>รหัสผ่านชั่วคราว:</strong> <code style="background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; color: #d93838; font-size: 16px; font-weight: bold; letter-spacing: 1px;">${tempPass}</code></p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://krapongbeer.github.io/CAD_Messenger/" style="background-color: #3b1359; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">เข้าสู่ระบบที่นี่</a>
          </div>
          
          <p style="color: #d93838; font-size: 14px; background-color: #fef2f2; padding: 12px; border-radius: 6px; border: 1px solid #fca5a5; text-align: center;">* กรุณานำรหัสผ่านชั่วคราวข้างต้นไปเข้าสู่ระบบเพื่อตั้งรหัสผ่านใหม่ของท่านทันที</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
            ติดต่อสอบถามเพิ่มเติมได้ที่:<br>
            ทีมงานพัฒนาระบบ SmartCAD Messenger<br>
            กองบริหารงานกลาง สำนักงานมหาวิทยาลัย มหาวิทยาลัยเชียงใหม่<br>
            โทรศัพท์: 053-943011-14 | อีเมล: saraban@cmu.ac.th
          </p>
        </div>
      </div>
      `;

      sendEmail(email, mailSubject, mailBody, htmlBody);"""
content = content.replace(old_ca_email, new_ca_email)

# Replace reset_password email
old_rp_email = """    const mailSubject = "[SmartCAD Messenger] รหัสผ่านชั่วคราวของคุณ";
    const mailBody = `เรียน คุณ${fullname},\\n\\nระบบได้รับคำขอรีเซ็ตรหัสผ่านของท่านแล้ว\\nรหัสผ่านชั่วคราวใหม่คือ: ${tempPass}\\n\\nกรุณานำรหัสผ่านนี้ไปใช้เข้าสู่ระบบและท่านจะถูกบังคับให้ตั้งรหัสผ่านใหม่ทันที\\n\\nลิงก์เข้าสู่ระบบ: https://krapongbeer.github.io/CAD_Messenger/`;
    
    sendEmail(email, mailSubject, mailBody);"""
new_rp_email = """    const mailSubject = "[SmartCAD Messenger] รหัสผ่านชั่วคราวของคุณ";
    const mailBody = `เรียน คุณ${fullname},\\n\\nระบบได้รับคำขอรีเซ็ตรหัสผ่านของท่านแล้ว\\nรหัสผ่านชั่วคราวใหม่คือ: ${tempPass}\\n\\nกรุณานำรหัสผ่านนี้ไปใช้เข้าสู่ระบบและท่านจะถูกบังคับให้ตั้งรหัสผ่านใหม่ทันที\\n\\nลิงก์เข้าสู่ระบบ: https://krapongbeer.github.io/CAD_Messenger/`;
    
    const htmlBody = `
      <div style="font-family: 'Sarabun', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9fb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #3b1359 0%, #5c2483 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SmartCAD Messenger</h1>
          <p style="color: #e09f19; margin: 5px 0 0 0; font-size: 14px;">กองบริหารงานกลาง สำนักงานมหาวิทยาลัย</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #333333; font-size: 16px; margin-top: 0;">เรียน <strong>คุณ${fullname}</strong>,</p>
          <p style="color: #555555; font-size: 15px; line-height: 1.6;">ระบบได้รับคำขอรีเซ็ตรหัสผ่านของท่านเรียบร้อยแล้ว</p>
          
          <div style="background-color: #ffffff; border-left: 4px solid #e09f19; padding: 20px; margin: 25px 0; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
            <p style="margin: 0 0 10px 0; color: #555555; font-size: 15px;"><strong>บัญชีผู้ใช้ (Email):</strong> <span style="color: #3b1359;">${email}</span></p>
            <p style="margin: 0; color: #555555; font-size: 15px;"><strong>รหัสผ่านชั่วคราวใหม่:</strong> <code style="background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; color: #d93838; font-size: 16px; font-weight: bold; letter-spacing: 1px;">${tempPass}</code></p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://krapongbeer.github.io/CAD_Messenger/" style="background-color: #3b1359; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">เข้าสู่ระบบที่นี่</a>
          </div>
          
          <p style="color: #d93838; font-size: 14px; background-color: #fef2f2; padding: 12px; border-radius: 6px; border: 1px solid #fca5a5; text-align: center;">* กรุณานำรหัสผ่านชั่วคราวข้างต้นไปเข้าสู่ระบบเพื่อตั้งรหัสผ่านใหม่ของท่านทันที</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
            ติดต่อสอบถามเพิ่มเติมได้ที่:<br>
            ทีมงานพัฒนาระบบ SmartCAD Messenger<br>
            กองบริหารงานกลาง สำนักงานมหาวิทยาลัย มหาวิทยาลัยเชียงใหม่<br>
            โทรศัพท์: 053-943011-14 | อีเมล: saraban@cmu.ac.th
          </p>
        </div>
      </div>
      `;
      
    sendEmail(email, mailSubject, mailBody, htmlBody);"""
content = content.replace(old_rp_email, new_rp_email)

with open("/Users/krapong/Documents/AntiGravity/smart-cad-messenger+supabase/appsscript_sync.js", "w") as f:
    f.write(content)

print("Patched appsscript_sync.js successfully")
