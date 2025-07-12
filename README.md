# HMS (Hotel Management System)

ระบบจัดการโรงแรมที่พัฒนาด้วย React + TypeScript (Frontend) และ Node.js + Express (Backend)

## ฟีเจอร์หลัก

- **จัดการห้องพัก**: เพิ่ม/แก้ไข/ลบข้อมูลห้องพัก
- **ระบบคิดค่าน้ำค่าไฟ**: สร้างบิลและคำนวณค่าน้ำค่าไฟ
- **บันทึกบิลลงฐานข้อมูล**: เก็บประวัติบิลทั้งหมด
- **ตรวจสอบสถานะการจ่ายเงิน**: ดูและอัปเดตสถานะการจ่ายเงินของแต่ละห้อง
- **ดาวน์โหลดบิล**: ส่งออกเป็น PDF หรือ PNG
- **ตั้งค่าหน่วยน้ำ-ไฟ**: ปรับอัตราค่าน้ำค่าไฟได้

## การติดตั้ง

### 1. ติดตั้ง Dependencies ทั้งหมด
```bash
npm run install:all
```

### 2. รันทั้ง Frontend และ Backend พร้อมกัน
```bash
npm run dev:all
```

## คำสั่งที่มีให้

- `npm run install:all` - ติดตั้ง dependencies ทั้ง frontend และ backend
- `npm run dev` - รันทั้ง frontend และ backend พร้อมกัน
- `npm run dev:server` - รันเฉพาะ backend
- `npm run start` - รัน backend ในโหมด production
- `npm run build` - build frontend สำหรับ production

## โครงสร้างโปรเจค

```
HMS/
├── client/          # Frontend (React + TypeScript + Vite)
├── server/          # Backend (Node.js + Express + TypeScript)
├── package.json     # Root package.json สำหรับรันคำสั่งรวม
└── README.md        # ไฟล์นี้
```

## การเข้าถึง

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## การพัฒนา

### รันแยกกัน
- Frontend: `cd client && npm run dev`
- Backend: `npm run dev:server`

### รันพร้อมกัน
- ทั้งคู่: `npm run dev` 