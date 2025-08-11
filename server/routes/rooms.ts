import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { query } from "../db.js";

const roomsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

// GET /api/rooms
fastify.get("/", async (request, reply) => {
  try {
    console.log("Rooms API called");
    console.log("Environment check:");
    console.log("PGHOST:", process.env.PGHOST || "not set");
    console.log("PGDATABASE:", process.env.PGDATABASE || "not set");
    console.log("PGUSER:", process.env.PGUSER || "not set");
    console.log("PGPASSWORD:", process.env.PGPASSWORD ? "***" : "not set");
    
    console.log("DB connection test - starting query...");
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
    console.log("Rooms data retrieved successfully:", rooms.length, "rooms");
    return rooms;
  } catch (err) {
    console.error("Database connection error:", err);
    
    // Return mock data when database is not available
    const mockRooms = [
      {
        id: 1,
        ชื่อ: "ห้อง 101",
        สถานะ: "ว่าง",
        isActive: false,
        tenants: []
      },
      {
        id: 2,
        ชื่อ: "ห้อง 102",
        สถานะ: "มีผู้เช่า",
        isActive: true,
        tenants: [{
          id: 1,
          name: "สมชาย ใจดี",
          phone: "081-234-5678",
          startDate: "2023-12-31T17:00:00.000Z",
          endDate: null,
          note: "จ่ายตรงเวลา"
        }]
      }
    ];
    
    console.log("Returning mock data due to DB error");
    return mockRooms;
  }
});

// POST /api/rooms
fastify.post("/", async (request, reply) => {
  const { ชื่อ } = request.body as any;
  try {
    const result = await query(
      "INSERT INTO rooms (name) VALUES ($1) RETURNING *",
      [ชื่อ]
    );
    return reply.status(201).send({ id: result.rows[0].id, name: result.rows[0].name, status: "ว่าง" });
  } catch (err) {
    return reply.status(500).send({ error: "ไม่สามารถเพิ่มห้องพักได้" });
  }
});

// PUT /api/rooms/:id
fastify.put("/:id", async (request, reply) => {
  const { id } = request.params as any;
  const { ชื่อ } = request.body as any;
  try {
    const result = await query(
      "UPDATE rooms SET name=$1 WHERE id=$2 RETURNING *",
      [ชื่อ, id]
    );
    if (result.rows.length === 0) return reply.status(404).send({ error: "ไม่พบห้องพัก" });
    return { id: result.rows[0].id, name: result.rows[0].name };
  } catch (err) {
    return reply.status(500).send({ error: "ไม่สามารถแก้ไขห้องพักได้" });
  }
});

// DELETE /api/rooms/:id
fastify.delete("/:id", async (request, reply) => {
  const { id } = request.params as any;
  try {
    const result = await query("DELETE FROM rooms WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return reply.status(404).send({ error: "ไม่พบห้องพัก" });
    return { id: result.rows[0].id, name: result.rows[0].name };
  } catch (err) {
    return reply.status(500).send({ error: "ไม่สามารถลบห้องพักได้" });
  }
});

};

export default roomsRoutes;