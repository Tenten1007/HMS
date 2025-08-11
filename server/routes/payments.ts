import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { query } from "../db.js";
import { Payment, toPayment } from "../models/payment.model.js";

const paymentsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

// GET /api/payments
fastify.get("/", async (request, reply) => {
  try {
    const result = await query("SELECT * FROM payments ORDER BY id DESC");
    return result.rows.map(toPayment);
  } catch (err) {
    return reply.status(500).send({ error: "Failed to fetch payments" });
  }
});

// POST /api/payments
fastify.post("/", async (request, reply) => {
  const { billId, amount, method, slipUrl, note, paidAt } = request.body as any;
  try {
    const result = await query(
      `INSERT INTO payments (bill_id, amount, method, slip_url, note, paid_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
      [billId, amount, method, slipUrl, note, paidAt]
    );
    return reply.status(201).send(toPayment(result.rows[0]));
  } catch (err) {
    return reply.status(500).send({ error: "Failed to create payment" });
  }
});

// PUT /api/payments/:id
fastify.put("/:id", async (request, reply) => {
  const { id } = request.params as any;
  const { note } = request.body as any;
  try {
    const result = await query(
      "UPDATE payments SET note=$1 WHERE id=$2 RETURNING *",
      [note, id]
    );
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "Payment not found" });
    }
    return toPayment(result.rows[0]);
  } catch (err) {
    return reply.status(500).send({ error: "Failed to update payment" });
  }
});

// DELETE /api/payments/:id
fastify.delete("/:id", async (request, reply) => {
  const { id } = request.params as any;
  try {
    const result = await query("DELETE FROM payments WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "Payment not found" });
    }
    return toPayment(result.rows[0]);
  } catch (err) {
    return reply.status(500).send({ error: "Failed to delete payment" });
  }
});

};

export default paymentsRoutes;