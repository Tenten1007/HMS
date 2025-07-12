import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateBill } from "./generateBill.js";
import roomsRouter from "./routes/rooms.js";
import billsRouter from "./routes/bills.js";
import paymentsRouter from "./routes/payments.js";
import tenantsRouter from "./routes/tenants.js";
import lineRouter from "./routes/line.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/api/rooms", roomsRouter);
app.use("/api/bills", billsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api", lineRouter);
app.use('/bills', express.static(path.join(__dirname, 'public/bills')));

// Endpoint: POST /api/generate-bill
// body: { ...billData, format: "pdf" | "png" }
app.post("/api/generate-bill", async (req: Request, res: Response) => {
  const { bill, format = "pdf" } = req.body;
  if (!bill) return res.status(400).json({ error: "Missing bill data" });

  try {
    const buffer = await generateBill(bill, format);
    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=bill.pdf");
    } else {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", "attachment; filename=bill.png");
    }
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 