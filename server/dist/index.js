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
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { generateBill } from "./generateBill.js";
import roomsRouter from "./routes/rooms.js";
import billsRouter from "./routes/bills.js";
import paymentsRouter from "./routes/payments.js";
import tenantsRouter from "./routes/tenants.js";
import lineRouter from "./routes/line.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/api/rooms", roomsRouter);
app.use("/api/bills", billsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api", lineRouter);
app.use('/bills', express.static(path.join(__dirname, 'public/bills')));
// เพิ่ม middleware เพื่อ expose header
app.use((req, res, next) => {
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    next();
});
// Endpoint: POST /api/generate-bill
// body: { ...billData, format: "pdf" | "png" }
app.post("/api/generate-bill", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bill, format = "pdf" } = req.body;
    if (!bill)
        return res.status(400).json({ error: "Missing bill data" });
    try {
        const buffer = yield generateBill(bill, format);
        // สร้างชื่อไฟล์ custom
        function getMonthNameEN(month) {
            return [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ][month - 1] || "";
        }
        const rawRoom = bill.roomName || bill.room_name || bill.roomId || bill.room_id || "Room";
        const safeRoom = String(rawRoom).replace(/[^a-zA-Z0-9_-]/g, "_"); // แทนที่อักขระพิเศษ/ไทย/ช่องว่างด้วย _
        const month = bill.month || (bill.billDate ? (new Date(bill.billDate).getMonth() + 1) : undefined);
        const year = bill.year || (bill.billDate ? (new Date(bill.billDate).getFullYear()) : undefined);
        const yearBE = year ? (Number(year) + 543) : "";
        const monthName = month ? getMonthNameEN(Number(month)) : "";
        const fileBase = `Bill_${safeRoom}_${monthName}_${yearBE}`;
        const ext = format === "pdf" ? ".pdf" : ".png";
        const filename = `${fileBase}${ext}`;
        if (format === "pdf") {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        }
        else {
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        }
        res.send(buffer);
    }
    catch (err) {
        res.status(500).json({ error: err.message || "Failed to generate bill" });
    }
}));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
});
