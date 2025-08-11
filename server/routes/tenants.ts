import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { query } from "../db.js";

const tenantsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

// GET /api/tenants
fastify.get("/", async (request, reply) => {
  try {
    const result = await query("SELECT * FROM tenants ORDER BY id");
    return result.rows;
  } catch (err) {
    return reply.status(500).send({ error: "ไม่สามารถดึงข้อมูลผู้เช่าได้" });
  }
});

// POST /api/tenants
fastify.post("/", async (request, reply) => {
  const { room_id, name, phone, start_date, end_date, note } = request.body as any;
  try {
    const result = await query(
      "INSERT INTO tenants (room_id, name, phone, start_date, end_date, note) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [room_id, name, phone, start_date, end_date || null, note]
    );
    return reply.status(201).send(result.rows[0]);
  } catch (err) {
    return reply.status(500).send({ error: "ไม่สามารถเพิ่มผู้เช่าได้" });
  }
});

// PUT /api/tenants/:id
fastify.put("/:id", async (request, reply) => {
  const { id } = request.params as any;
  const { room_id, name, phone, start_date, end_date, note } = request.body as any;
  try {
    const result = await query(
      "UPDATE tenants SET room_id=$1, name=$2, phone=$3, start_date=$4, end_date=$5, note=$6, updated_at=NOW() WHERE id=$7 RETURNING *",
      [room_id, name, phone, start_date, end_date || null, note, id]
    );
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "ไม่พบผู้เช่า" });
    }
    return result.rows[0];
  } catch (err) {
    return reply.status(500).send({ error: "ไม่สามารถแก้ไขผู้เช่าได้" });
  }
});

// DELETE /api/tenants/:id
fastify.delete('/:id', async (request, reply) => {
  const { id } = request.params as any;
  try {
    const result = await query('DELETE FROM tenants WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'ไม่พบผู้เช่า' });
    }
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: 'ไม่สามารถลบผู้เช่าได้' });
  }
});

};

export default tenantsRoutes;