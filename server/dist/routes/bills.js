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
import { toBill } from "../models/bill.model.js";
const router = express.Router();
// GET /api/bills
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield query(`
      SELECT b.*, r.name as room_name 
      FROM bills b 
      LEFT JOIN rooms r ON b.room_id = r.id 
      ORDER BY b.id DESC
    `);
        res.json(result.rows.map(toBill));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch bills" });
    }
}));
// POST /api/bills
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId, month, year, roomRate, waterPrev, waterCurr, waterUsed, waterRate, electricPrev, electricCurr, electricUsed, electricRate, total, status, paidAmount } = req.body;
    try {
        const result = yield query(`INSERT INTO bills (room_id, month, year, room_rate, water_prev, water_curr, water_used, water_rate, electric_prev, electric_curr, electric_used, electric_rate, total, status, paid_amount, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW()) RETURNING *`, [roomId, month, year, roomRate, waterPrev, waterCurr, waterUsed, waterRate, electricPrev, electricCurr, electricUsed, electricRate, total, status, paidAmount !== null && paidAmount !== void 0 ? paidAmount : 0]);
        res.status(201).json(toBill(result.rows[0]));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to create bill" });
    }
}));
// PUT /api/bills/:id
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status, month, year, waterPrev, waterCurr, electricPrev, electricCurr, paidAmount } = req.body;
    try {
        let queryText = "UPDATE bills SET updated_at=NOW()";
        let params = [];
        let paramIndex = 1;
        if (status !== undefined) {
            queryText += `, status=$${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (month !== undefined) {
            queryText += `, month=$${paramIndex}`;
            params.push(month);
            paramIndex++;
        }
        if (year !== undefined) {
            queryText += `, year=$${paramIndex}`;
            params.push(year);
            paramIndex++;
        }
        if (waterPrev !== undefined) {
            queryText += `, water_prev=$${paramIndex}`;
            params.push(waterPrev);
            paramIndex++;
        }
        if (waterCurr !== undefined) {
            queryText += `, water_curr=$${paramIndex}`;
            params.push(waterCurr);
            paramIndex++;
        }
        if (electricPrev !== undefined) {
            queryText += `, electric_prev=$${paramIndex}`;
            params.push(electricPrev);
            paramIndex++;
        }
        if (electricCurr !== undefined) {
            queryText += `, electric_curr=$${paramIndex}`;
            params.push(electricCurr);
            paramIndex++;
        }
        if (paidAmount !== undefined) {
            queryText += `, paid_amount=$${paramIndex}`;
            params.push(paidAmount);
            paramIndex++;
        }
        queryText += ` WHERE id=$${paramIndex} RETURNING *`;
        params.push(id);
        const result = yield query(queryText, params);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Bill not found" });
        res.json(toBill(result.rows[0]));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to update bill" });
    }
}));
// DELETE /api/bills/:id
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield query("DELETE FROM bills WHERE id=$1 RETURNING *", [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Bill not found" });
        res.json(toBill(result.rows[0]));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to delete bill" });
    }
}));
export default router;
