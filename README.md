# HMS (Hotel Management System)

ระบบจัดการโรงแรมที่พัฒนาด้วย React + TypeScript (Frontend) และ Node.js + Express (Backend)

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