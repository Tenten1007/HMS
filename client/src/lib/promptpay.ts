// Minimal PromptPay QR payload generator for browser (mobile only)
// รองรับเฉพาะเบอร์มือถือ 10 หลัก (เช่น 0812345678)

import generatePromptPay from "promptpay-qr";

export function generatePromptPayPayload(number: string, amount?: number) {
  // sanitize เบอร์/เลขบัตร (ลบ non-digit)
  const sanitized = number.replace(/\D/g, "");
  if (amount) {
    return generatePromptPay(sanitized, { amount: Number(amount) });
  } else {
    return generatePromptPay(sanitized, undefined);
  }
} 