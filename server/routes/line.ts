import express from "express";
import fetch from "node-fetch";
import { query } from "../db.js";
import { generateBill } from "../generateBill.js";
import fs from "fs";
import path from "path";

const router = express.Router();

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const GROUP_ID = process.env.LINE_GROUP_ID;
const PUBLIC_URL = process.env.PUBLIC_URL || ""; // เช่น https://xxxx.ngrok-free.app
const billsDir = path.join(process.cwd(), "server", "public", "bills");

// เสิร์ฟ static files (ควรเพิ่มใน index.ts ด้วย)
// app.use('/bills', express.static(path.join(__dirname, 'public/bills')));

router.post("/send-bills-to-line", async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: "Missing month/year" });
    // ดึงบิลเดือน/ปีที่เลือก
    const billsResult = await query(
      `SELECT b.*, r.name as room_name FROM bills b LEFT JOIN rooms r ON b.room_id = r.id WHERE b.year = $1 AND b.month = $2`,
      [year, month]
    );
    const bills = billsResult.rows;
    // Filter เฉพาะบิลที่ยังไม่จ่าย
    const unpaidBills = bills.filter((bill: any) => bill.status === "unpaid");
    if (!unpaidBills.length) return res.status(404).json({ error: "ไม่พบข้อมูลบิลที่ยังไม่จ่ายในเดือน/ปีนี้" });

    // สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!fs.existsSync(billsDir)) fs.mkdirSync(billsDir, { recursive: true });

    for (const bill of unpaidBills) {
      // 1. generateBill PNG
      const buffer = await generateBill(bill, "png");
      // ใช้ roomId (หรือ room_id) และ timestamp เป็นชื่อไฟล์ (ไม่มีภาษาไทย)
      const safeRoom = (bill.roomId || bill.room_id || "room").toString().replace(/[^a-zA-Z0-9_-]/g, "");
      const timestamp = Date.now();
      const fileName = `bill_${safeRoom}_${bill.month}_${bill.year}_${timestamp}.png`;
      const filePath = path.join(billsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      await new Promise(r => setTimeout(r, 2000)); // wait ให้ไฟล์พร้อมเสิร์ฟ (2 วินาที)
      // 2. สร้าง imageUrl (ต้องเป็น public URL)
      const imageUrl = `${PUBLIC_URL}/bills/${fileName}`;
      // 3. ส่งข้อความ+รูปภาพเข้าไลน์กลุ่ม
      const message = `${bill.room_name || bill.roomId || '-'}: ${Number(bill.total).toLocaleString()} บาท\nกรุณาชำระเงินภายในวันที่ 5 ของเดือนถัดไป`;
      // ทดสอบ: ใช้ URL รูปจาก Unsplash แทน imageUrl ที่ generate เอง
      const testImageUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80";
      const lineBody = {
        to: GROUP_ID,
        messages: [
          { type: "text", text: message },
          { type: "image", originalContentUrl: testImageUrl, previewImageUrl: testImageUrl }
        ]
      };
      console.log("DEBUG LINE BODY", JSON.stringify(lineBody, null, 2));
      const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(lineBody)
      });
      const lineJson = await lineRes.json();
      console.log("DEBUG LINE RESPONSE", lineJson);
      if (lineJson.message) throw new Error(lineJson.message);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 