import Fastify from "fastify";
import cors from "@fastify/cors";
import fs from "fs";
import path from "path";
import { generateBill } from "./generateBill";

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, {
  origin: true
});

// Generate bill endpoint
fastify.post("/api/generate-bill", async (request, reply) => {
  const { bill, format = "pdf" } = request.body as any;
  if (!bill) {
    return reply.status(400).send({ error: "Missing bill data" });
  }

  try {
    const buffer = await generateBill(bill, format);
    // สร้างชื่อไฟล์ custom
    function getMonthNameEN(month: number) {
      return [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ][month - 1] || "";
    }
    const rawRoom = bill.roomName || bill.room_name || bill.roomId || bill.room_id || "Room";
    const safeRoom = String(rawRoom).replace(/[^a-zA-Z0-9_-]/g, "_");
    const month = bill.month || (bill.billDate ? (new Date(bill.billDate).getMonth() + 1) : undefined);
    const year = bill.year || (bill.billDate ? (new Date(bill.billDate).getFullYear()) : undefined);
    const yearBE = year ? (Number(year) + 543) : "";
    const monthName = month ? getMonthNameEN(Number(month)) : "";
    const fileBase = `Bill_${safeRoom}_${monthName}_${yearBE}`;
    const ext = format === "pdf" ? ".pdf" : ".png";
    const filename = `${fileBase}${ext}`;
    
    if (format === "pdf") {
      reply.type("application/pdf");
      reply.header("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      reply.type("image/png");  
      reply.header("Content-Disposition", `attachment; filename="${filename}"`);
    }
    reply.header("Access-Control-Expose-Headers", "Content-Disposition");
    return reply.send(buffer);
  } catch (err: any) {
    return reply.status(500).send({ error: err.message || "Failed to generate bill" });
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