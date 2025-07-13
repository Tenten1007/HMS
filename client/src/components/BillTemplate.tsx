import React from "react";
import QRCode from "react-qr-code";
import { generatePromptPayPayload } from "../lib/promptpay";

interface BillTemplateProps {
  roomName: string;
  roomRate: number;
  waterPrev: number;
  waterCurr: number;
  waterUsed: number;
  waterRate: number;
  electricPrev: number;
  electricCurr: number;
  electricUsed: number;
  electricRate: number;
  total: number;
  billDate?: string; // เพิ่ม prop วันที่
  promptpayNumber?: string; // เพิ่ม prop เบอร์พร้อมเพย์ (optional)
}

const BillTemplate: React.FC<BillTemplateProps> = ({
  roomName,
  roomRate,
  waterPrev,
  waterCurr,
  waterUsed,
  waterRate,
  electricPrev,
  electricCurr,
  electricUsed,
  electricRate,
  total,
  billDate, // destructure billDate
  promptpayNumber,
}) => {
  // สร้าง payload พร้อมเพย์ (ถ้ามีเบอร์)
  let qrPayload = "";
  if (promptpayNumber) {
    try {
      qrPayload = generatePromptPayPayload(promptpayNumber, total);
    } catch (e) {
      qrPayload = "";
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg mt-[300px] p-4 sm:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto my-4 font-sans text-slate-800 border border-slate-200 max-h-[100vh] overflow-y-auto mt-[150px]">
      <div className="text-center mb-4">
        <div className="text-xl font-bold">ใบแจ้งหนี้ค่าห้องพัก</div>
        {/* เพิ่มรายละเอียดเดือน/ปี */}
        {billDate && (
          <div className="text-base text-slate-600 mb-1">
            ประจำเดือน {(() => {
              const months = [
                "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
              ];
              const d = new Date(billDate);
              return `${months[d.getMonth()]} ${d.getFullYear() + 543}`;
            })()}
          </div>
        )}
        <div className="text-sm text-slate-500">(ตัวอย่างบิล)</div>
      </div>
      <div className="mb-2 flex justify-between">
        <span className="font-semibold">{roomName}</span>
        <span className="text-slate-500">ค่าห้อง {roomRate.toLocaleString()} บาท</span>
      </div>
      <div className="mb-2">
        <div className="text-sm">เลขมิเตอร์น้ำ เดือนที่แล้ว: <span className="font-semibold">{waterPrev}</span></div>
        <div className="text-sm">เลขมิเตอร์น้ำ เดือนนี้: <span className="font-semibold">{waterCurr}</span></div>
        <div className="text-sm">หน่วยน้ำที่ใช้: <span className="font-semibold">{waterUsed}</span> หน่วย</div>
        <div className="text-sm">ค่าน้ำ: <span className="font-semibold">{(waterUsed * waterRate).toLocaleString()}</span> บาท ({waterRate} บาท/หน่วย)</div>
      </div>
      <div className="mb-2">
        <div className="text-sm">เลขมิเตอร์ไฟ เดือนที่แล้ว: <span className="font-semibold">{electricPrev}</span></div>
        <div className="text-sm">เลขมิเตอร์ไฟ เดือนนี้: <span className="font-semibold">{electricCurr}</span></div>
        <div className="text-sm">หน่วยไฟที่ใช้: <span className="font-semibold">{electricUsed}</span> หน่วย</div>
        <div className="text-sm">ค่าไฟ: <span className="font-semibold">{(electricUsed * electricRate).toLocaleString()}</span> บาท ({electricRate} บาท/หน่วย)</div>
      </div>
      <div className="flex justify-between items-center mt-6">
        <span className="font-bold text-lg">รวมทั้งสิ้น</span>
        <span className="text-2xl font-bold text-green-600">{total.toLocaleString()} บาท</span>
      </div>
      {qrPayload && (
        <div className="flex flex-col items-center mt-4">
          {/* @ts-ignore */}
          <QRCode value={qrPayload} size={160} />
          <div className="text-xs text-slate-500 mt-2">สแกนจ่ายผ่าน PromptPay</div>
        </div>
      )}
      <div className="text-xs text-slate-400 mt-6 text-center">* กรุณาชำระเงินก่อนวันที่ 5 ของเดือนถัดไป</div>
    </div>
  );
};

export default BillTemplate; 