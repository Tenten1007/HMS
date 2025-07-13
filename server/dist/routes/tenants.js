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
// GET /api/tenants
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield query("SELECT * FROM tenants ORDER BY id");
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: "ไม่สามารถดึงข้อมูลผู้เช่าได้" });
    }
}));
// POST /api/tenants
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { room_id, name, phone, start_date, end_date, note } = req.body;
    try {
        const result = yield query("INSERT INTO tenants (room_id, name, phone, start_date, end_date, note) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [room_id, name, phone, start_date, end_date || null, note]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: "ไม่สามารถเพิ่มผู้เช่าได้" });
    }
}));
// DELETE /api/tenants/:id
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield query('DELETE FROM tenants WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'ไม่พบผู้เช่า' });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'ไม่สามารถลบผู้เช่าได้' });
    }
}));
export default router;
