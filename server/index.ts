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
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'https://hms-pi73dtshi-tenten07s-projects.vercel.app',
    'https://hms-pied-mu.vercel.app',
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*-tenten07s-projects\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
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
    // Set CORS headers explicitly
    reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    reply.header('Access-Control-Allow-Credentials', 'true');
    
    const billData = request.body as any;
    const buffer = await generateBill(billData, "pdf");
    
    reply.type('application/pdf');
    reply.header('Content-Disposition', `attachment; filename="bill_${billData.roomId || 'unknown'}_${billData.month}_${billData.year}.pdf"`);
    return buffer;
  } catch (error: any) {
    console.error("Bill generation error:", error.message);
    return reply.status(503).send({ 
      error: "Bill generation temporarily unavailable due to server configuration. Please try again later.",
      details: error.message 
    });
  }
});

// Handle preflight requests for generate-bill
fastify.options("/api/generate-bill", async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  reply.header('Access-Control-Allow-Credentials', 'true');
  reply.status(200).send();
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