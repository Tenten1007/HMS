import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatMoney(num: number | string) {
  return Number(num).toLocaleString("en-US");
}

function getField(obj: any, camel: string, snake: string) {
  return obj[camel] ?? obj[snake] ?? "";
}

export async function generateBill(bill: any, format: "pdf" | "png" = "pdf") {
  console.log("DEBUG BILL DATA:", bill);
  // คำนวณค่าน้ำและค่าไฟ
  const waterCost = Number(getField(bill, "waterUsed", "water_used")) * Number(getField(bill, "waterRate", "water_rate"));
  const electricCost = Number(getField(bill, "electricUsed", "electric_used")) * Number(getField(bill, "electricRate", "electric_rate"));

  // Load HTML template
  const templatePath = path.join(__dirname, "templates", "bill.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // สร้าง QR Code PromptPay (ใช้ require แบบ dynamic)
  const promptpayNumber = process.env.PROMPTPAY_NUMBER || "0800000000";
  const amount = Number(bill.total); // แปลงเป็น number
  let qrBase64 = "";
  try {
    const promptpay = (await import('promptpay-qr')).default;
    const QRCode = await import('qrcode');
    const payload = promptpay(promptpayNumber, { amount });
    qrBase64 = await QRCode.default.toDataURL(payload, { margin: 1, width: 160 });
  } catch (e) {
    console.error("QR ERROR", e);
    qrBase64 = "";
  }

  // Simple replace (ควรใช้ template engine จริงจัง)
  html = html.replace(/{{roomName}}/g, String(getField(bill, "roomName", "room_name")))
    .replace(/{{roomRate}}/g, formatMoney(getField(bill, "roomRate", "room_rate")))
    .replace(/{{waterPrev}}/g, String(getField(bill, "waterPrev", "water_prev")))
    .replace(/{{waterCurr}}/g, String(getField(bill, "waterCurr", "water_curr")))
    .replace(/{{waterUsed}}/g, String(getField(bill, "waterUsed", "water_used")))
    .replace(/{{waterRate}}/g, String(getField(bill, "waterRate", "water_rate")))
    .replace(/{{waterCost}}/g, formatMoney(waterCost))
    .replace(/{{electricPrev}}/g, String(getField(bill, "electricPrev", "electric_prev")))
    .replace(/{{electricCurr}}/g, String(getField(bill, "electricCurr", "electric_curr")))
    .replace(/{{electricUsed}}/g, String(getField(bill, "electricUsed", "electric_used")))
    .replace(/{{electricRate}}/g, String(getField(bill, "electricRate", "electric_rate")))
    .replace(/{{electricCost}}/g, formatMoney(electricCost))
    .replace(/{{total}}/g, formatMoney(getField(bill, "total", "total")))
    .replace(/{{promptpay_qr}}/g, qrBase64 ? `<img src='${qrBase64}' alt='PromptPay QR' style='display:block;margin:12px auto 0;width:160px;height:160px;'>` : "");
  console.log("DEBUG HTML:", html);

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.waitForTimeout(1000); // รอให้ render สมบูรณ์
  let buffer: Buffer;
  if (format === "pdf") {
    buffer = await page.pdf({ format: "A5", printBackground: true });
  } else {
    buffer = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  }
  await browser.close();
  return buffer;
} 