import fs from "fs";
import path from "path";

let puppeteer: any = null;

// Initialize dependencies
async function initializeDependencies() {
  if (puppeteer) return; // Already initialized
  
  try {
    // Try to load puppeteer-core with fallbacks
    try {
      puppeteer = (await import("puppeteer-core")).default;
    } catch {
      puppeteer = require("puppeteer-core");
    }
    console.log("Puppeteer loaded successfully");
    
    console.log("Puppeteer initialization completed - skipping browser test");
    
  } catch (error) {
    console.error("Puppeteer initialization failed:", error instanceof Error ? error.message : String(error));
    throw new Error("PDF generation service is temporarily unavailable. Please try again later.");
  }
}

function formatMoney(num: number | string) {
  return Number(num).toLocaleString("en-US");
}

function getField(obj: any, camel: string, snake: string) {
  return obj[camel] ?? obj[snake] ?? "";
}

export async function generateBill(bill: any, format: "pdf" | "png" = "pdf") {
  console.log(`Starting bill generation for room: ${bill.roomName}`);
  
  // Initialize dependencies quickly without browser testing
  try {
    await initializeDependencies();
  } catch (error) {
    console.error('Failed to initialize dependencies:', error);
    throw new Error('Server initialization failed. Please try again.');
  }
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
  
  // Log only essential info in production
  console.log(`Generating bill for room ${getField(bill, "roomName", "room_name")} - ${billMonthYear}`);

  let browser = null;
  try {
    console.log('Launching browser...');
    console.log('Chrome path:', process.env.CHROME_BIN || '/usr/bin/google-chrome-stable');
    
    // Check if Chrome exists
    try {
      const { execSync } = require('child_process');
      const chromeVersion = execSync('google-chrome --version').toString();
      console.log('Chrome version:', chromeVersion);
    } catch (error) {
      console.error('Error checking Chrome version:', error);
    }
    
    browser = await Promise.race([
      puppeteer.launch({ 
        headless: 'new',
        executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable',
        timeout: 30000, // 30 seconds timeout
        protocolTimeout: 30000,
        product: 'chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-client-side-phishing-detection',
          '--disable-features=TranslateUI',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-web-security',
          '--enable-automation',
          '--enable-logging',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--password-store=basic',
          '--use-mock-keychain',
          '--single-process',
          '--disable-gpu',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ]
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Browser launch timeout')), 50000)) // 50 seconds
    ]);
    console.log('Browser launched successfully');
    
    const page = await Promise.race([
      browser.newPage(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('New page timeout')), 30000)) // Increase timeout
    ]);
    console.log('New page created');
    
    // Set page configurations with timeout
    await Promise.all([
      page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'),
      page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 })
    ]);
    
    // Set content with timeout
    await Promise.race([
      page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Set content timeout')), 35000))
    ]);
    console.log('Content set successfully');
    
    // Fixed dimensions for faster processing
    const billWidth = 360;
    const billHeight = 800; // Fixed height instead of dynamic calculation
    
    await page.setViewport({ width: billWidth, height: billHeight });
    
    let buffer: Buffer;
    if (format === "pdf") {
      console.log('Generating PDF...');
      const pdfUint8 = await Promise.race([
        page.pdf({
          width: `${billWidth}px`,
          height: `${billHeight}px`,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          timeout: 60000 // Increase PDF timeout
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PDF generation timeout')), 65000))
      ]);
      buffer = Buffer.from(pdfUint8);
      console.log('PDF generated successfully');
    } else {
      console.log('Generating PNG...');
      const pngUint8 = await Promise.race([
        page.screenshot({ 
          type: "png", 
          clip: { x: 0, y: 0, width: billWidth, height: billHeight },
          timeout: 60000 // Increase PNG timeout
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PNG generation timeout')), 65000))
      ]);
      buffer = Buffer.from(pngUint8);
      console.log('PNG generated successfully');
    }
    
    return buffer;
  } catch (error) {
    console.error('Bill generation failed:', error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Request timeout - server is busy. Please try again in a few minutes.');
      } else if (error.message.includes('Target closed') || error.message.includes('Protocol error')) {
        throw new Error('Browser service unavailable. Please try again later.');
      } else if (error.message.includes('Navigation timeout')) {
        throw new Error('Content loading timeout. Please try again.');
      }
    }
    
    throw new Error('Bill generation failed. Please try again later.');
  } finally {
    if (browser) {
      try {
        const pages = await browser.pages();
        await Promise.all(pages.map((page: any) => page.close()));
        await browser.close();
        console.log('Browser cleanup completed');
      } catch (cleanupError) {
        console.error('Browser cleanup failed:', cleanupError);
        try {
          await browser.disconnect();
        } catch (disconnectError) {
          console.error('Browser disconnect failed:', disconnectError);
        }
      }
    }
  }
} 