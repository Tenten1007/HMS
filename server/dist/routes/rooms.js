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
import { query } from "../db.js";
const router = express.Router();
// GET /api/rooms
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomsResult = yield query(`
      SELECT r.id, r.name
      FROM rooms r
      ORDER BY r.id
    `);
        const tenantsResult = yield query(`
      SELECT * FROM tenants`);
        const today = yield query(`SELECT (now() at time zone 'Asia/Bangkok')::date as today`);
        const todayDate = today.rows[0].today;
        const rooms = roomsResult.rows.map((room) => {
            // หา tenants ที่ active สำหรับห้องนี้
            const tenants = tenantsResult.rows.filter((t) => t.room_id === room.id &&
                t.start_date <= todayDate &&
                (!t.end_date || todayDate <= t.end_date));
            return {
                id: room.id,
                ชื่อ: room.name,
                สถานะ: tenants.length > 0 ? 'มีผู้เช่า' : 'ว่าง',
                isActive: tenants.length > 0,
                tenants: tenants.map((t) => ({
                    id: t.id,
                    name: t.name,
                    phone: t.phone,
                    startDate: t.start_date,
                    endDate: t.end_date,
                    note: t.note
                }))
            };
        });
        res.json(rooms);
    }
    catch (err) {
        res.status(500).json({ error: "ไม่สามารถดึงข้อมูลห้องพักได้" });
    }
}));
// POST /api/rooms
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ชื่อ } = req.body;
    try {
        const result = yield query("INSERT INTO rooms (name) VALUES ($1) RETURNING *", [ชื่อ]);
        res.status(201).json({ id: result.rows[0].id, name: result.rows[0].name, status: "ว่าง" });
    }
    catch (err) {
        res.status(500).json({ error: "ไม่สามารถเพิ่มห้องพักได้" });
    }
}));
// PUT /api/rooms/:id
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { ชื่อ } = req.body;
    try {
        const result = yield query("UPDATE rooms SET name=$1 WHERE id=$2 RETURNING *", [ชื่อ, id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "ไม่พบห้องพัก" });
        res.json({ id: result.rows[0].id, name: result.rows[0].name });
    }
    catch (err) {
        res.status(500).json({ error: "ไม่สามารถแก้ไขห้องพักได้" });
    }
}));
// DELETE /api/rooms/:id
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield query("DELETE FROM rooms WHERE id=$1 RETURNING *", [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "ไม่พบห้องพัก" });
        res.json({ id: result.rows[0].id, name: result.rows[0].name });
    }
    catch (err) {
        res.status(500).json({ error: "ไม่สามารถลบห้องพักได้" });
    }
}));
export default router;
