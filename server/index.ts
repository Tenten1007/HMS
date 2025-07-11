import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import roomsRouter from "./routes/rooms.js";
import billsRouter from "./routes/bills.js";
import paymentsRouter from "./routes/payments.js";
import tenantsRouter from "./routes/tenants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/api/rooms", roomsRouter);
app.use("/api/bills", billsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/tenants", tenantsRouter);

// Endpoint: POST /api/generate-bill
// body: { ...billData, format: "pdf" | "png" }
app.post("/api/generate-bill", async (req: Request, res: Response) => {
  const { bill, format = "pdf" } = req.body;
  if (!bill) return res.status(400).json({ error: "Missing bill data" });

  // คำนวณค่าน้ำและค่าไฟ
  const waterCost = bill.waterUsed * bill.waterRate;
  const electricCost = bill.electricUsed * bill.electricRate;

  // Load HTML template (placeholder)
  const templatePath = path.join(__dirname, "templates", "bill.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // Simple replace (ควรใช้ template engine จริงจัง)
  html = html.replace(/{{roomName}}/g, String(bill.roomName))
    .replace(/{{roomRate}}/g, String(bill.roomRate))
    .replace(/{{waterPrev}}/g, String(bill.waterPrev))
    .replace(/{{waterCurr}}/g, String(bill.waterCurr))
    .replace(/{{waterUsed}}/g, String(bill.waterUsed))
    .replace(/{{waterRate}}/g, String(bill.waterRate))
    .replace(/{{waterCost}}/g, String(waterCost))
    .replace(/{{electricPrev}}/g, String(bill.electricPrev))
    .replace(/{{electricCurr}}/g, String(bill.electricCurr))
    .replace(/{{electricUsed}}/g, String(bill.electricUsed))
    .replace(/{{electricRate}}/g, String(bill.electricRate))
    .replace(/{{electricCost}}/g, String(electricCost))
    .replace(/{{total}}/g, String(bill.total));

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    let buffer: Buffer;
    if (format === "pdf") {
      buffer = await page.pdf({ format: "A5", printBackground: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=bill.pdf");
    } else {
      buffer = await page.screenshot({ type: "png", fullPage: true });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", "attachment; filename=bill.png");
    }
    await browser.close();
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 