import React, { useState, useEffect } from "react";
import GlassCard from "../components/GlassCard";
import BillTemplate from "../components/BillTemplate";

const getRate = (key: string, fallback: number) => Number(localStorage.getItem(key)) || fallback;

const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

type BillForm = {
  roomName: string;
  roomRate: number;
  waterPrev: number;
  waterCurr: number;
  electricPrev: number;
  electricCurr: number;
  billDate: string;
};

const BillingSystem: React.FC = () => {
  const [form, setForm] = useState<BillForm>({
    roomName: "ห้อง 101",
    roomRate: getRate("roomRate", 3500),
    waterPrev: 0,
    waterCurr: 0,
    electricPrev: 0,
    electricCurr: 0,
    billDate: todayStr(),
  });
  const waterRate = getRate("waterRate", 18);
  const electricRate = getRate("electricRate", 10);
  const [preview, setPreview] = useState(false);
  const [roomOptions, setRoomOptions] = useState<{value: string, label: string, id: number}[]>([]);
  const [allBills, setAllBills] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetch("http://localhost:4000/api/rooms")
      .then(res => res.json())
      .then(data => {
        const activeRooms = data.filter((room: any) => room.isActive);
        setRoomOptions(activeRooms.map((room: any) => ({ value: room.ชื่อ, label: room.ชื่อ, id: room.id })));
      });
    // ดึงบิลทั้งหมดมาเก็บไว้
    fetch("http://localhost:4000/api/bills")
      .then(res => res.json())
      .then(data => setAllBills(data));
  }, []);

  // เติมเลขมิเตอร์เดือนที่แล้วอัตโนมัติเมื่อเปลี่ยนห้องหรือวันที่
  useEffect(() => {
    const selectedRoom = roomOptions.find(room => room.value === form.roomName);
    if (!selectedRoom) return;
    const billDate = new Date(form.billDate);
    const month = billDate.getMonth() + 1;
    const year = billDate.getFullYear();
    const prevBill = allBills
      .filter(b => b.roomId === selectedRoom.id && (b.year < year || (b.year === year && b.month < month)))
      .sort((a, b) => b.year - a.year || b.month - a.month)[0];
    setForm(prev => ({
      ...prev,
      waterPrev: prevBill ? prevBill.waterCurr : 0,
      electricPrev: prevBill ? prevBill.electricCurr : 0,
    }));
    // eslint-disable-next-line
  }, [form.roomName, form.billDate, allBills]);

  const handleChange = (field: keyof BillForm, value: string | number) => {
    // ไม่ให้แก้ไข roomRate ในฟอร์ม
    if (field === "roomRate") return;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBill = async () => {
    const waterUsed = Math.max(0, form.waterCurr - form.waterPrev);
    const electricUsed = Math.max(0, form.electricCurr - form.electricPrev);
    const total = waterUsed * waterRate + electricUsed * electricRate + form.roomRate;
    
    const billDate = new Date(form.billDate);
    const month = billDate.getMonth() + 1;
    const year = billDate.getFullYear();
    
    const selectedRoom = roomOptions.find(room => room.value === form.roomName);
    const billData = {
      roomId: selectedRoom?.id || 1,
      month,
      year,
      roomRate: form.roomRate,
      waterPrev: form.waterPrev,
      waterCurr: form.waterCurr,
      waterUsed,
      waterRate,
      electricPrev: form.electricPrev,
      electricCurr: form.electricCurr,
      electricUsed,
      electricRate,
      total,
      status: "unpaid"
    };

    try {
      const res = await fetch("http://localhost:4000/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });
      
      if (res.ok) {
        const savedBill = await res.json();
        setShowSuccess(true);
        // รีเซ็ตฟอร์ม (เลือกห้องถัดไปถ้ามี)
        const currentIdx = roomOptions.findIndex(r => r.value === form.roomName);
        const nextRoom = roomOptions[(currentIdx + 1) % roomOptions.length];
        setForm({
          roomName: nextRoom.value,
          roomRate: getRate("roomRate", 3500),
          waterPrev: 0,
          waterCurr: 0,
          electricPrev: 0,
          electricCurr: 0,
          billDate: todayStr(),
        });
        setTimeout(() => setShowSuccess(false), 2000);
        return savedBill;
      } else {
        throw new Error("Failed to save bill");
      }
    } catch (error) {
      console.error("Error saving bill:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกบิล");
    }
  };

  const handleDownloadFromBackend = async (format: "pdf" | "png") => {
    const waterUsed = Math.max(0, form.waterCurr - form.waterPrev);
    const electricUsed = Math.max(0, form.electricCurr - form.electricPrev);
    const bill = {
      ...form,
      waterUsed,
      waterRate,
      electricUsed,
      electricRate,
      total: waterUsed * waterRate + electricUsed * electricRate + form.roomRate,
    };
    const res = await fetch("http://localhost:4000/api/generate-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bill, format }),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = format === "pdf" ? "bill.pdf" : "bill.png";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const waterUsed = Math.max(0, form.waterCurr - form.waterPrev);
  const electricUsed = Math.max(0, form.electricCurr - form.electricPrev);
  const waterCost = waterUsed * waterRate;
  const electricCost = electricUsed * electricRate;
  const total = waterCost + electricCost + form.roomRate;

  // เพิ่มอ่านเบอร์พร้อมเพย์จาก env
  const PROMPTPAY_NUMBER = import.meta.env.VITE_PROMPTPAY_NUMBER || "0800000000";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 drop-shadow">ระบบคิดค่าน้ำค่าไฟ</h2>
      <GlassCard className="w-full max-w-md">
        <form className="flex flex-col gap-6">
          <div>
            <label className="block mb-2 font-semibold">เลือกห้อง</label>
            <select
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={form.roomName}
              onChange={e => handleChange("roomName", e.target.value)}
            >
              {roomOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold">วันที่ทำบิล</label>
            <input
              type="date"
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={form.billDate}
              onChange={e => handleChange("billDate", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">เลขมิเตอร์น้ำ เดือนที่แล้ว</label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.waterPrev}
                min={0}
                onChange={e => handleChange("waterPrev", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">เลขมิเตอร์น้ำ เดือนนี้</label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.waterCurr}
                min={0}
                onChange={e => handleChange("waterCurr", Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">เลขมิเตอร์ไฟ เดือนที่แล้ว</label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200"
                value={form.electricPrev}
                min={0}
                onChange={e => handleChange("electricPrev", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">เลขมิเตอร์ไฟ เดือนนี้</label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={form.electricCurr}
                min={0}
                onChange={e => handleChange("electricCurr", Number(e.target.value))}
              />
            </div>
          </div>
        </form>
        <div className="flex flex-col gap-1 mt-4 text-sm text-slate-700">
          <div>หน่วยน้ำที่ใช้: <span className="font-semibold">{waterUsed}</span> หน่วย (เลขเก่า {form.waterPrev} - เลขใหม่ {form.waterCurr})</div>
          <div>หน่วยไฟที่ใช้: <span className="font-semibold">{electricUsed}</span> หน่วย (เลขเก่า {form.electricPrev} - เลขใหม่ {form.electricCurr})</div>
        </div>
        <div className="flex flex-col gap-1 mt-2 text-sm text-slate-700">
          <div>ค่าน้ำ: <span className="font-semibold">{waterCost.toLocaleString()}</span> บาท ({waterRate} บาท/หน่วย)</div>
          <div>ค่าไฟ: <span className="font-semibold">{electricCost.toLocaleString()}</span> บาท ({electricRate} บาท/หน่วย)</div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="font-semibold">รวม</span>
          <span className="text-xl font-bold text-green-600">{total.toLocaleString()} บาท</span>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSaveBill}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow text-base font-semibold"
          >
            บันทึกบิล
          </button>
          <button
            onClick={() => setPreview(true)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow text-base font-semibold"
          >
            ดูตัวอย่างบิล
          </button>
        </div>
      </GlassCard>
      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg text-lg font-bold animate-fade-in">
          ✅ บันทึกบิลสำเร็จ! พร้อมกรอกห้องถัดไป
        </div>
      )}
      {/* Modal/Overlay สำหรับแสดง BillTemplate และดาวน์โหลด PDF/PNG */}
      {preview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 m-0">
          <div className="flex flex-col items-center justify-center w-full max-h-[95vh] overflow-y-auto p-0 m-0">
            <div
              className="bg-white rounded-2xl shadow-lg"
              style={{ width: 360, maxWidth: "100vw", margin: 0, padding: 0 }}
            >
              <BillTemplate
                roomName={form.roomName}
                roomRate={form.roomRate}
                waterPrev={form.waterPrev}
                waterCurr={form.waterCurr}
                waterUsed={waterUsed}
                waterRate={waterRate}
                electricPrev={form.electricPrev}
                electricCurr={form.electricCurr}
                electricUsed={electricUsed}
                electricRate={electricRate}
                total={total}
                billDate={form.billDate}
                promptpayNumber={PROMPTPAY_NUMBER}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-end w-full max-w-xs mx-auto py-2">
              <button
                onClick={() => handleDownloadFromBackend("pdf")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow text-sm w-full"
              >
                ดาวน์โหลด PDF
              </button>
              <button
                onClick={() => handleDownloadFromBackend("png")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow text-sm w-full"
              >
                ดาวน์โหลด PNG
              </button>
              <button
                onClick={() => setPreview(false)}
                className="bg-gray-300 hover:bg-gray-400 text-slate-700 px-4 py-2 rounded-lg shadow text-sm w-full"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSystem; 