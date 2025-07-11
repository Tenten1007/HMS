import express from "express";
import { query } from "../db.js";
import { Payment, toPayment } from "../models/payment.model.js";

const router = express.Router();

// GET /api/payments
router.get("/", async (req, res) => {
  try {
    const result = await query("SELECT * FROM payments ORDER BY id DESC");
    res.json(result.rows.map(toPayment));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// POST /api/payments
router.post("/", async (req, res) => {
  const { billId, amount, method, slipUrl, note, paidAt } = req.body;
  try {
    const result = await query(
      `INSERT INTO payments (bill_id, amount, method, slip_url, note, paid_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
      [billId, amount, method, slipUrl, note, paidAt]
    );
    res.status(201).json(toPayment(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to create payment" });
  }
});

// PUT /api/payments/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const result = await query(
      "UPDATE payments SET note=$1 WHERE id=$2 RETURNING *",
      [note, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Payment not found" });
    res.json(toPayment(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to update payment" });
  }
});

// DELETE /api/payments/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM payments WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Payment not found" });
    res.json(toPayment(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

export default router; 