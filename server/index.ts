import Fastify from "fastify";
import cors from "@fastify/cors";
import fs from "fs";
import path from "path";
import roomsRoutes from "./routes/rooms.js";
// import { generateBill } from "./generateBill"; // ชั่วคราวปิดใช้

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, {
  origin: true
});

// Register routes
fastify.register(roomsRoutes, { prefix: "/api/rooms" });

// Health check endpoint
fastify.get("/api/health", async (request, reply) => {
  return { status: "OK", message: "HMS Backend is running!" };
});

// Generate bill endpoint (ปิดชั่วคราว)
fastify.post("/api/generate-bill", async (request, reply) => {
  return reply.status(503).send({ 
    error: "Bill generation temporarily disabled. Backend is working!" 
  });
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