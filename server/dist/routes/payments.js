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
import { toPayment } from "../models/payment.model.js";
const router = express.Router();
// GET /api/payments
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield query("SELECT * FROM payments ORDER BY id DESC");
        res.json(result.rows.map(toPayment));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
}));
// POST /api/payments
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { billId, amount, method, slipUrl, note, paidAt } = req.body;
    try {
        const result = yield query(`INSERT INTO payments (bill_id, amount, method, slip_url, note, paid_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`, [billId, amount, method, slipUrl, note, paidAt]);
        res.status(201).json(toPayment(result.rows[0]));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to create payment" });
    }
}));
// PUT /api/payments/:id
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { note } = req.body;
    try {
        const result = yield query("UPDATE payments SET note=$1 WHERE id=$2 RETURNING *", [note, id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Payment not found" });
        res.json(toPayment(result.rows[0]));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to update payment" });
    }
}));
// DELETE /api/payments/:id
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield query("DELETE FROM payments WHERE id=$1 RETURNING *", [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Payment not found" });
        res.json(toPayment(result.rows[0]));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to delete payment" });
    }
}));
export default router;
