import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { query } from "../db.js";
import { generateBill } from "../generateBill.js";
import { uploadToStorage } from "../lib/uploadToStorage.js";

const lineRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const GROUP_ID = process.env.LINE_GROUP_ID;
const BUCKET_FOLDER = "bills"; // Optional: prefix folder in bucket

fastify.post("/send-bills-to-line", async (request, reply) => {
  try {
    const { month, year } = request.body as any;
    if (!month || !year) {
      return reply.status(400).send({ error: "Missing month/year" });
    }
    
    // ดึงบิลเดือน/ปีที่เลือก
    const billsResult = await query(
      `SELECT b.*, r.name as room_name FROM bills b LEFT JOIN rooms r ON b.room_id = r.id WHERE b.year = $1 AND b.month = $2`,
      [year, month]
    );
    const bills = billsResult.rows;
    
    // Filter เฉพาะบิลที่ยังไม่จ่ายหรือจ่ายบางส่วน
    const targetBills = bills.filter((bill: any) => bill.status === "unpaid" || bill.status === "partial");
    if (!targetBills.length) {
      return reply.status(404).send({ error: "ไม่พบข้อมูลบิลที่ยังไม่จ่ายหรือจ่ายบางส่วนในเดือน/ปีนี้" });
    }

    // Check required environment variables
    if (!CHANNEL_ACCESS_TOKEN || !GROUP_ID) {
      return reply.status(500).send({ 
        error: "LINE credentials not configured. Please set LINE_CHANNEL_ACCESS_TOKEN and LINE_GROUP_ID." 
      });
    }
    for (const bill of targetBills) {
      // 1. generateBill PNG (ขาว-ดำ, viewport อัตโนมัติ)
      const buffer = await generateBill(bill, "png");
      // 2. upload PNG to Google Cloud Storage
      const fileName = `${BUCKET_FOLDER}/bill_${bill.roomId || bill.room_id}_${bill.month}_${bill.year}_${Date.now()}.png`;
      const { directLink } = await uploadToStorage({ buffer, filename: fileName });
      // 3. ส่งข้อความ+รูปภาพเข้าไลน์กลุ่ม
      const message = `${bill.room_name || bill.roomId || '-'}: ${Number(bill.total).toLocaleString()} บาท\nกรุณาชำระเงินก่อนวันที่ 5 ของเดือนถัดไป`;
      const lineBody = {
        to: GROUP_ID,
        messages: [
          { type: "text", text: message },
          { type: "image", originalContentUrl: directLink, previewImageUrl: directLink }
        ]
      };
      const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(lineBody)
      });
      const lineJson = await lineRes.json();
      if (lineJson.message) throw new Error(lineJson.message);
    }

    return { success: true, sent: targetBills.length };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

};

export default lineRoutes;