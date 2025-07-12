import React, { useState, useEffect } from "react";
import GlassCard from "../components/GlassCard";

const Settings: React.FC = () => {
  const [waterRate, setWaterRate] = useState(() => Number(localStorage.getItem("waterRate")) || 18);
  const [electricRate, setElectricRate] = useState(() => Number(localStorage.getItem("electricRate")) || 10);
  const [roomRate, setRoomRate] = useState(() => Number(localStorage.getItem("roomRate")) || 3500);

  useEffect(() => {
    localStorage.setItem("waterRate", String(waterRate));
  }, [waterRate]);
  useEffect(() => {
    localStorage.setItem("electricRate", String(electricRate));
  }, [electricRate]);
  useEffect(() => {
    localStorage.setItem("roomRate", String(roomRate));
  }, [roomRate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 drop-shadow">ตั้งค่าหน่วยน้ำ-ไฟ และค่าห้อง</h2>
      <GlassCard className="w-full max-w-md">
        <form className="flex flex-col gap-6">
          <div>
            <label className="block mb-2 font-semibold">ราคาหน่วยน้ำ (บาท/หน่วย)</label>
            <input
              type="number"
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={waterRate}
              min={0}
              onChange={e => setWaterRate(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">ราคาหน่วยไฟ (บาท/หน่วย)</label>
            <input
              type="number"
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
              value={electricRate}
              min={0}
              onChange={e => setElectricRate(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">ราคาค่าห้อง (บาท/เดือน)</label>
            <input
              type="number"
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
              value={roomRate}
              min={0}
              onChange={e => setRoomRate(Number(e.target.value))}
            />
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default Settings; 