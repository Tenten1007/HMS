import Fastify from "fastify";
import cors from "@fastify/cors";
import fs from "fs";
import path from "path";
import roomsRoutes from "./routes/rooms.js";
import billsRoutes from "./routes/bills.js";
import tenantsRoutes from "./routes/tenants.js";
import paymentsRoutes from "./routes/payments.js";
import lineRoutes from "./routes/line.js";
import { generateBill } from "./generateBill.js";

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, {
  origin: true
});

// Register routes
fastify.register(roomsRoutes, { prefix: "/api/rooms" });
fastify.register(billsRoutes, { prefix: "/api/bills" });
fastify.register(tenantsRoutes, { prefix: "/api/tenants" });
fastify.register(paymentsRoutes, { prefix: "/api/payments" });
fastify.register(lineRoutes, { prefix: "/api" });

// Health check endpoint
fastify.get("/api/health", async (request, reply) => {
  return { status: "OK", message: "HMS Backend is running!" };
});

// Generate bill endpoint
fastify.post("/api/generate-bill", async (request, reply) => {
  try {
    const billData = request.body as any;
    const buffer = await generateBill(billData, "pdf");
    
    reply.type('application/pdf');
    reply.header('Content-Disposition', `attachment; filename="bill_${billData.roomId || 'unknown'}_${billData.month}_${billData.year}.pdf"`);
    return buffer;
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
});

const PORT = Number(process.env.PORT) || 4000;
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
start(); 