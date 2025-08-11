import fs from "fs";
import path from "path";

let puppeteer: any = null;

// Initialize dependencies
async function initializeDependencies() {
  if (puppeteer) return; // Already initialized
  
  try {
    puppeteer = (await import("puppeteer")).default;
    console.log("Puppeteer loaded successfully");
  } catch (error) {
    console.error("Puppeteer import error:", error instanceof Error ? error.message : String(error));
    throw new Error("Puppeteer is required for bill generation but is not available");
  }
}

function formatMoney(num: number | string) {
  return Number(num).toLocaleString("en-US");
}

function getField(obj: any, camel: string, snake: string) {
  return obj[camel] ?? obj[snake] ?? "";
}

export async function generateBill(bill: any, format: "pdf" | "png" = "pdf") {
  // Initialize dependencies
  await initializeDependencies();
  // คำนวณค่าน้ำและค่าไฟ
  const waterCost = Number(getField(bill, "waterUsed", "water_used")) * Number(getField(bill, "waterRate", "water_rate"));
  const electricCost = Number(getField(bill, "electricUsed", "electric_used")) * Number(getField(bill, "electricRate", "electric_rate"));

  // Load HTML template (always use print template)
  const templatePath = path.join(__dirname, "templates", "bill_print.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // สร้าง QR Code PromptPay (ใช้ require แบบ dynamic)
  const promptpayNumber = process.env.PROMPTPAY_NUMBER || "0800000000";
  let amount = Number(bill.total);
  let paidAmount = 0;
  let remainingAmount = amount;
  
  if (bill.paid_amount !== undefined && bill.paid_amount > 0 && bill.paid_amount < bill.total) {
    paidAmount = Number(bill.paid_amount);
    amount = Number(bill.total) - paidAmount;
    remainingAmount = amount;
  } else if (bill.paidAmount !== undefined && bill.paidAmount > 0 && bill.paidAmount < bill.total) {
    paidAmount = Number(bill.paidAmount);
    amount = Number(bill.total) - paidAmount;
    remainingAmount = amount;
  }
  let qrBase64 = "";
  try {
    const promptpay = (await import("promptpay-qr")).default;
    const QRCode = (await import("qrcode")).default;
    const payload = promptpay(promptpayNumber, { amount });
    qrBase64 = await QRCode.toDataURL(payload, { margin: 1, width: 160 });
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
    .replace(/{{paidAmount}}/g, formatMoney(paidAmount))
    .replace(/{{remainingAmount}}/g, formatMoney(remainingAmount))
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

  let browser = null;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      timeout: 30000, // Reduce timeout to 30 seconds
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI,VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--safebrowsing-disable-auto-update',
        '--disable-background-networking',
        '--memory-pressure-off',
        '--max_old_space_size=4096'
      ]
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 });
    
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
    
    return buffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
} 