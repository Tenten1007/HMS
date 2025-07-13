# HMS Production Deployment Guide

## 1. Requirements
- Node.js (v18+)
- npm (v9+)
- PostgreSQL Database
- Cloudinary, Google Cloud Service Account, LINE API (ถ้าใช้)

## 2. Installation
```sh
git clone <YOUR_REPO_URL>
cd HMS
npm install
cd client && npm install && cd ..
```

## 3. Environment Variables
สร้างไฟล์ `.env` ที่ root และ/หรือใน server directory (ดูตัวอย่างด้านล่าง)

### ตัวอย่าง .env
```
# Database
PGUSER=postgres
PGHOST=localhost
PGDATABASE=hms
PGPASSWORD=yourpassword
PGPORT=5432

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Cloud Service Account
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account.json

# LINE API
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_GROUP_ID=your_line_group_id

# Server
PORT=4000
```

**หมายเหตุ:**
- ห้าม commit ไฟล์ .env หรือ service-account.json ลง git repo
- ควรเก็บ service-account.json ไว้ใน server ที่ปลอดภัยเท่านั้น

## 4. Build Production
```sh
npm run build
```
- จะ build ทั้ง server (TypeScript → JS) และ client (Vite)

## 5. Start Production Server
```sh
npm run start
```
- Server จะรันที่ PORT ที่กำหนด (default: 4000)
- Client static files อยู่ใน `client/dist` (ถ้าต้องการ serve ด้วย nginx หรือ static hosting)

## 6. Deploy Suggestion
- ใช้ pm2, Docker, หรือ cloud platform (เช่น GCP, AWS, Azure) สำหรับ production
- ตัวอย่าง pm2:
  ```sh
  pm2 start npm --name hms-backend -- run start
  ```
- ตรวจสอบ log และ health check เสมอ

## 7. Database
- ตรวจสอบ schema และ seed ข้อมูลใน db/ (เช่น seed.db)
- ใช้ pgAdmin หรือ psql สำหรับ import/export

## 8. Security
- ห้าม commit secret, key, หรือ .env ลง git
- เปลี่ยน key/service account ใหม่ทันทีหากรั่วไหล

## 9. Troubleshooting
- ตรวจสอบ log server และ client
- ตรวจสอบว่า env ครบถ้วนและถูกต้อง
- ตรวจสอบว่า build สำเร็จและไฟล์ dist ถูกสร้าง

---

**Contact:**
- ผู้ดูแลระบบ/DevOps/ผู้พัฒนา 