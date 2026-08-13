# 📦 SmartCAD-Messenger (กองบริหารงานกลาง สำนักงานมหาวิทยาลัย)

ระบบบริหารจัดการและติดตามรับ-ส่ง เอกสาร/จดหมาย/พัสดุ สำหรับ กองบริหารงานกลาง สำนักงานมหาวิทยาลัยเชียงใหม่ (CMU) เชื่อมต่อระบบฐานข้อมูล Supabase และ Google Apps Script สเปกความปลอดภัยสูง

---

## 🌟 คุณสมบัติหลักของระบบ (Features)

- 📊 **Dashboard & Interactive KPI Cards:** แดชบอร์ดแสดงสถิติประจำวัน สรุปสถานะ และคลิกดูตารางแยกตามประเภทได้อย่างสะดวก
- 📦 **Parcel Tracking System:** บันทึก ติดตาม ค้นหา และอัปเดตสถานะการรับ-ส่งเอกสาร/พัสดุ
- 🔐 **NIST Password & Role-Based Access Control (RBAC):**
  - **👑 Admin (ผู้ดูแลระบบ):** จัดการสิทธิ์ผู้ใช้ อนุมัติสิทธิ์ ลบบัญชี และรีเซ็ตรหัสผ่านส่งอีเมล
  - **💼 Executive (ผู้บริหาร):** เข้าถึงสถิติและภาพรวมรายงานของทั้งองค์กร
  - **👤 Staff (พนักงาน):** บันทึกและติดตามพัสดุตามสิทธิ์ที่ได้รับ
- 📑 **Official A4 PDF Report:** ออกรายงานสรุปการรับ-ส่งพัสดุ พรีวิวและสั่งพิมพ์เป็นเอกสาร PDF ทางการ
- ⚡ **Realtime Database Synchronization:** ซิงก์ข้อมูลแบบเรียลไทม์ผ่าน Supabase Postgres Changes
- 📧 **Automated Email Notifications:** ระบบส่งอีเมลภาษาไทยผ่าน Google Apps Script แจ้งรหัสผ่านและอนุมัติการใช้งาน

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
smart-cad-messenger/
├── .gitignore                      # บล็อกไฟล์สำรอง (.zip), ไฟล์ร่าง (.rtf), และไฟล์ระบบ
├── .nojekyll                       # ข้ามระบบ Jekyll บน GitHub Pages เพื่อให้โหลดได้เร็ว
├── README.md                       # คู่มือการใช้งานและเอกสารอธิบายระบบ
├── index.html                      # แอปพลิเคชันหลัก (Single Page Application - SPA)
└── backend/
    ├── appsscript_sync.gs          # สคริปต์หลังบ้าน Google Apps Script Webhook (Email & User Sync)
    └── supabase_email_template.html# แม่แบบอีเมลแจ้งเตือนรหัสผ่านชั่วคราว (Thai Email Template)
```

---

## 🚀 การติดตั้งและใช้งานบน GitHub Pages

1. นำไฟล์ทั้งหมดในคลังนี้ไปวางในคลัง GitHub สาธารณะหรือส่วนตัว
2. เข้าไปที่ **Settings -> Pages** บน GitHub
3. ตั้งค่า **Source** เป็น `Deploy from a branch` เลือกบรันช์ `main` และโฟลเดอร์ `/ (root)`
4. ระบบจะเปิดให้ใช้งานผ่าน URL: `https://<username>.github.io/<repository-name>/` ทันที

---

## 🛡️ ความปลอดภัยของข้อมูล (Security Architecture)

- ระบบใช้ **Supabase Row Level Security (RLS)** ควบคุมสิทธิ์การอ่าน-เขียนข้อมูลในระดับฐานข้อมูล
- รหัสผ่านของผู้ใช้งานทั้งหมดผ่านกระบวนการเข้ารหัสความปลอดภัยมาตรฐาน NIST
- คีย์ความลับสำหรับงาน Admin ปฏิบัติการผ่าน Google Apps Script Webhook ในหลังบ้าน ป้องกันรหัสความลับหลุดสู่หน้าเว็บ

---

© 2026 SmartCAD-Messenger - กองบริหารงานกลาง สำนักงานมหาวิทยาลัยเชียงใหม่
