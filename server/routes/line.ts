import express from "express";
import fetch from "node-fetch";
import { query } from "../db.js";

const router = express.Router();

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const GROUP_ID = process.env.LINE_GROUP_ID;

router.post("/send-bills-to-line", async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: "Missing month/year" });
    // ดึงบิลเดือน/ปีที่เลือก
    const billsResult = await query(
      "SELECT * FROM bills WHERE year = $1 AND month = $2",
      [year, month]
    );
    const bills = billsResult.rows;
    if (!bills.length) return res.status(404).json({ error: "ไม่พบข้อมูลบิลในเดือน/ปีนี้" });

    // สร้างข้อความ
    let message = `📢 แจ้งบิลค่าห้องประจำเดือน ${month}/${year}\n\n`;
    bills.forEach((bill: any) => {
      message += `ห้อง ${bill.room_name || bill.roomid}: ${Number(bill.total).toLocaleString()} บาท\n`;
    });
    message += "\n* กรุณาชำระเงินภายในวันที่ 5 ของเดือนถัดไป";

    // ส่งเข้าไลน์กลุ่ม
    const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: GROUP_ID,
        messages: [{ type: "text", text: message }]
      })
    });
    const lineJson = await lineRes.json();
    if (lineJson.message) throw new Error(lineJson.message);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 