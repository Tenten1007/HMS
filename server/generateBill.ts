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
  // คำนวณค่าน้ำและค่าไฟ
  const waterCost = Number(getField(bill, "waterUsed", "water_used")) * Number(getField(bill, "waterRate", "water_rate"));
  const electricCost = Number(getField(bill, "electricUsed", "electric_used")) * Number(getField(bill, "electricRate", "electric_rate"));

  // Load HTML template (always use print template)
  const templatePath = path.join(__dirname, "templates", "bill_print.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // สร้าง QR Code PromptPay (ใช้ require แบบ dynamic)
  const promptpayNumber = process.env.PROMPTPAY_NUMBER || "0800000000";
  let amount = Number(bill.total);
  if (bill.paid_amount !== undefined && bill.paid_amount > 0 && bill.paid_amount < bill.total) {
    amount = Number(bill.total) - Number(bill.paid_amount);
  } else if (bill.paidAmount !== undefined && bill.paidAmount > 0 && bill.paidAmount < bill.total) {
    amount = Number(bill.total) - Number(bill.paidAmount);
  }
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

  // สร้างชื่อเดือน/ปี
  function getMonthYearStr(dateStr: string) {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const d = new Date(dateStr);
    return `${months[d.getMonth()]} ${d.getFullYear() + 543}`; // พ.ศ.
  }
  const billMonthYear = getMonthYearStr(getField(bill, "billDate", "bill_date") || `${getField(bill, "year", "year")}-${String(getField(bill, "month", "month")).padStart(2, '0')}-01`);

  html = html.replace(/{{billMonthYear}}/g, billMonthYear);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  // คำนวณขนาด viewport อัตโนมัติจากขนาดเนื้อหา
  const billWidth = 360; // ต้องตรงกับ .bill ใน template
  const billHeight = await page.evaluate(() => {
    const el = document.querySelector('.bill');
    if (!el) return 600;
    const rect = el.getBoundingClientRect();
    return Math.ceil(rect.bottom - rect.top); // ใช้ bounding rect เพื่อรวม footer/margin/padding
  });
  // ตรวจสอบลิมิตความสูง PDF (puppeteer/chromium ~14400px)
  if (billHeight > 14400) {
    await browser.close();
    throw new Error('เนื้อหาบิลยาวเกินไป (สูงเกิน 14400px) กรุณาปรับ template หรือบีบเนื้อหาให้สั้นลง');
  }
  await page.setViewport({ width: billWidth, height: billHeight });
  await new Promise(res => setTimeout(res, 500));
  let buffer: Buffer;
  if (format === "pdf") {
    const pdfUint8 = await page.pdf({
      width: `${billWidth}px`,
      height: `${billHeight+100}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: '1',
      preferCSSPageSize: false
    });
    buffer = Buffer.from(pdfUint8);
  } else {
    const pngUint8 = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: billWidth, height: billHeight } });
    buffer = Buffer.from(pngUint8);
  }
  await browser.close();
  return buffer;
} 