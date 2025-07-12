import express from "express";
import { query } from "../db.js";
import { Bill, toBill } from "../models/bill.model.js";

const router = express.Router();

// GET /api/bills
router.get("/", async (req, res) => {
  try {
    const result = await query(`
      SELECT b.*, r.name as room_name 
      FROM bills b 
      LEFT JOIN rooms r ON b.room_id = r.id 
      ORDER BY b.id DESC
    `);
    res.json(result.rows.map(toBill));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

// POST /api/bills
router.post("/", async (req, res) => {
  const { roomId, month, year, roomRate, waterPrev, waterCurr, waterUsed, waterRate, electricPrev, electricCurr, electricUsed, electricRate, total, status } = req.body;
  try {
    const result = await query(
      `INSERT INTO bills (room_id, month, year, room_rate, water_prev, water_curr, water_used, water_rate, electric_prev, electric_curr, electric_used, electric_rate, total, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW()) RETURNING *`,
      [roomId, month, year, roomRate, waterPrev, waterCurr, waterUsed, waterRate, electricPrev, electricCurr, electricUsed, electricRate, total, status]
    );
    res.status(201).json(toBill(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to create bill" });
  }
});

// PUT /api/bills/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await query(
      "UPDATE bills SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Bill not found" });
    res.json(toBill(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to update bill" });
  }
});

// DELETE /api/bills/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM bills WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Bill not found" });
    res.json(toBill(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to delete bill" });
  }
});

export default router; 