import React from "react";

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
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto my-4 font-sans text-slate-800 border border-slate-200 max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-4">
        <div className="text-xl font-bold">ใบแจ้งหนี้ค่าห้องพัก</div>
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
      <div className="text-xs text-slate-400 mt-6 text-center">* กรุณาชำระเงินภายในวันที่ 5 ของเดือนถัดไป</div>
    </div>
  );
};

export default BillTemplate; 