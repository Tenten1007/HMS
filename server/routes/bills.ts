import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { query } from "../db.js";
import { Bill, toBill } from "../models/bill.model.js";

const billsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

// GET /api/bills
fastify.get("/", async (request, reply) => {
  try {
    const result = await query(`
      SELECT b.*, r.name as room_name 
      FROM bills b 
      LEFT JOIN rooms r ON b.room_id = r.id 
      ORDER BY b.id DESC
    `);
    return result.rows.map(toBill);
  } catch (err) {
    return reply.status(500).send({ error: "Failed to fetch bills" });
  }
});

// POST /api/bills
fastify.post("/", async (request, reply) => {
  const { roomId, month, year, roomRate, waterPrev, waterCurr, waterUsed, waterRate, electricPrev, electricCurr, electricUsed, electricRate, total, status, paidAmount } = request.body as any;
  try {
    const result = await query(
      `INSERT INTO bills (room_id, month, year, room_rate, water_prev, water_curr, water_used, water_rate, electric_prev, electric_curr, electric_used, electric_rate, total, status, paid_amount, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW()) RETURNING *`,
      [roomId, month, year, roomRate, waterPrev, waterCurr, waterUsed, waterRate, electricPrev, electricCurr, electricUsed, electricRate, total, status, paidAmount ?? 0]
    );
    return reply.status(201).send(toBill(result.rows[0]));
  } catch (err) {
    return reply.status(500).send({ error: "Failed to create bill" });
  }
});

// PUT /api/bills/:id
fastify.put("/:id", async (request, reply) => {
  const { id } = request.params as any;
  const { status, month, year, waterPrev, waterCurr, electricPrev, electricCurr, paidAmount } = request.body as any;
  
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
      queryText += `, water_curr=$${paramIndex}, water_used=$${paramIndex + 1}`;
      params.push(waterCurr, waterCurr - (waterPrev || 0));
      paramIndex += 2;
    }
    if (electricPrev !== undefined) {
      queryText += `, electric_prev=$${paramIndex}`;
      params.push(electricPrev);
      paramIndex++;
    }
    if (electricCurr !== undefined) {
      queryText += `, electric_curr=$${paramIndex}, electric_used=$${paramIndex + 1}`;
      params.push(electricCurr, electricCurr - (electricPrev || 0));
      paramIndex += 2;
    }
    if (paidAmount !== undefined) {
      queryText += `, paid_amount=$${paramIndex}`;
      params.push(paidAmount);
      paramIndex++;
    }

    queryText += ` WHERE id=$${paramIndex} RETURNING *`;
    params.push(id);

    const result = await query(queryText, params);
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "Bill not found" });
    }
    return toBill(result.rows[0]);
  } catch (err) {
    return reply.status(500).send({ error: "Failed to update bill" });
  }
});

// DELETE /api/bills/:id
fastify.delete("/:id", async (request, reply) => {
  const { id } = request.params as any;
  try {
    const result = await query("DELETE FROM bills WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "Bill not found" });
    }
    return toBill(result.rows[0]);
  } catch (err) {
    return reply.status(500).send({ error: "Failed to delete bill" });
  }
});

};

export default billsRoutes;