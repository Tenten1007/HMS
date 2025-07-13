import express from "express";
import { query } from "../db.js";

const router = express.Router();

// GET /api/rooms
router.get("/", async (req, res) => {
  try {
    const roomsResult = await query(`
      SELECT r.id, r.name
      FROM rooms r
      ORDER BY r.id
    `);
    const tenantsResult = await query(`
      SELECT * FROM tenants`);
    const today = await query(`SELECT (now() at time zone 'Asia/Bangkok')::date as today`);
    const todayDate = today.rows[0].today;
    const rooms = roomsResult.rows.map((room: any) => {
      // หา tenants ที่ active สำหรับห้องนี้
      const tenants = tenantsResult.rows.filter((t: any) =>
        t.room_id === room.id &&
        t.start_date <= todayDate &&
        (!t.end_date || todayDate <= t.end_date)
      );
      return {
        id: room.id,
        ชื่อ: room.name,
        สถานะ: tenants.length > 0 ? 'มีผู้เช่า' : 'ว่าง',
        isActive: tenants.length > 0,
        tenants: tenants.map((t: any) => ({
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
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลห้องพักได้" });
  }
});

// POST /api/rooms
router.post("/", async (req, res) => {
  const { ชื่อ } = req.body;
  try {
    const result = await query(
      "INSERT INTO rooms (name) VALUES ($1) RETURNING *",
      [ชื่อ]
    );
    res.status(201).json({ id: result.rows[0].id, name: result.rows[0].name, status: "ว่าง" });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถเพิ่มห้องพักได้" });
  }
});

// PUT /api/rooms/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { ชื่อ } = req.body;
  try {
    const result = await query(
      "UPDATE rooms SET name=$1 WHERE id=$2 RETURNING *",
      [ชื่อ, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "ไม่พบห้องพัก" });
    res.json({ id: result.rows[0].id, name: result.rows[0].name });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถแก้ไขห้องพักได้" });
  }
});

// DELETE /api/rooms/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM rooms WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "ไม่พบห้องพัก" });
    res.json({ id: result.rows[0].id, name: result.rows[0].name });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถลบห้องพักได้" });
  }
});

export default router; 