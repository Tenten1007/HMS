var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import fetch from "node-fetch";
import { query } from "../db.js";
import { generateBill } from "../generateBill.js";
import { uploadToStorage } from "../lib/uploadToStorage.js";
const router = express.Router();
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const GROUP_ID = process.env.LINE_GROUP_ID;
const BUCKET_FOLDER = "bills"; // Optional: prefix folder in bucket
router.post("/send-bills-to-line", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year } = req.body;
        if (!month || !year)
            return res.status(400).json({ error: "Missing month/year" });
        // ดึงบิลเดือน/ปีที่เลือก
        const billsResult = yield query(`SELECT b.*, r.name as room_name FROM bills b LEFT JOIN rooms r ON b.room_id = r.id WHERE b.year = $1 AND b.month = $2`, [year, month]);
        const bills = billsResult.rows;
        // Filter เฉพาะบิลที่ยังไม่จ่ายหรือจ่ายบางส่วน
        const targetBills = bills.filter((bill) => bill.status === "unpaid" || bill.status === "partial");
        if (!targetBills.length)
            return res.status(404).json({ error: "ไม่พบข้อมูลบิลที่ยังไม่จ่ายหรือจ่ายบางส่วนในเดือน/ปีนี้" });
        for (const bill of targetBills) {
            // 1. generateBill PNG (ขาว-ดำ, viewport อัตโนมัติ)
            const buffer = yield generateBill(bill, "png");
            // 2. upload PNG to Google Cloud Storage
            const fileName = `${BUCKET_FOLDER}/bill_${bill.roomId || bill.room_id}_${bill.month}_${bill.year}_${Date.now()}.png`;
            const { directLink } = yield uploadToStorage({ buffer, filename: fileName });
            // 3. ส่งข้อความ+รูปภาพเข้าไลน์กลุ่ม
            const message = `${bill.room_name || bill.roomId || '-'}: ${Number(bill.total).toLocaleString()} บาท\nกรุณาชำระเงินก่อนวันที่ 5 ของเดือนถัดไป`;
            const lineBody = {
                to: GROUP_ID,
                messages: [
                    { type: "text", text: message },
                    { type: "image", originalContentUrl: directLink, previewImageUrl: directLink }
                ]
            };
            const lineRes = yield fetch("https://api.line.me/v2/bot/message/push", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(lineBody)
            });
            const lineJson = yield lineRes.json();
            if (lineJson.message)
                throw new Error(lineJson.message);
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
export default router;
