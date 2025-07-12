import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatMoney(num: number | string) {
  return Number(num).toLocaleString("en-US");
}

export async function generateBill(bill: any, format: "pdf" | "png" = "pdf") {
  // คำนวณค่าน้ำและค่าไฟ
  const waterCost = bill.waterUsed * bill.waterRate;
  const electricCost = bill.electricUsed * bill.electricRate;

  // Load HTML template
  const templatePath = path.join(__dirname, "templates", "bill.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // สร้าง QR Code PromptPay (ใช้ require แบบ dynamic)
  const promptpayNumber = process.env.PROMPTPAY_NUMBER || "0800000000";
  const amount = bill.total;
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
  html = html.replace(/{{roomName}}/g, String(bill.roomName))
    .replace(/{{roomRate}}/g, formatMoney(bill.roomRate))
    .replace(/{{waterPrev}}/g, String(bill.waterPrev))
    .replace(/{{waterCurr}}/g, String(bill.waterCurr))
    .replace(/{{waterUsed}}/g, String(bill.waterUsed))
    .replace(/{{waterRate}}/g, String(bill.waterRate))
    .replace(/{{waterCost}}/g, formatMoney(waterCost))
    .replace(/{{electricPrev}}/g, String(bill.electricPrev))
    .replace(/{{electricCurr}}/g, String(bill.electricCurr))
    .replace(/{{electricUsed}}/g, String(bill.electricUsed))
    .replace(/{{electricRate}}/g, String(bill.electricRate))
    .replace(/{{electricCost}}/g, formatMoney(electricCost))
    .replace(/{{total}}/g, formatMoney(bill.total))
    .replace(/{{promptpay_qr}}/g, qrBase64 ? `<img src='${qrBase64}' alt='PromptPay QR' style='display:block;margin:12px auto 0;width:160px;height:160px;'>` : "");

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  let buffer: Buffer;
  if (format === "pdf") {
    buffer = await page.pdf({ format: "A5", printBackground: true });
  } else {
    buffer = await page.screenshot({ type: "png", fullPage: true });
  }
  await browser.close();
  return buffer;
} 