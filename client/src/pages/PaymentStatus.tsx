import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaClock, FaMoneyCheckAlt, FaPaperclip } from "react-icons/fa";

export default function PaymentStatus() {
  const [selectedMonthYear, setSelectedMonthYear] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [monthYearList, setMonthYearList] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:4000/api/bills").then(res => res.json()),
      fetch("http://localhost:4000/api/rooms").then(res => res.json()),
      fetch("http://localhost:4000/api/tenants").then(res => res.json())
    ]).then(([bills, rooms, tenants]) => {
      // join bills + rooms + tenants
      const invoices = bills.map(bill => {
        const room = rooms.find(r => r.id === bill.roomId || r.id === bill.room_id);
        const tenant = tenants.find(t => t.room_id === bill.roomId || t.room_id === bill.room_id);
        return {
          id: bill.id,
          room: room ? room.ชื่อ : "-",
          name: tenant ? tenant.name : "-",
          amount: bill.total,
          status: bill.status === "ชำระแล้ว" ? "ชำระแล้ว" : "รอชำระ",
          paidDate: bill.status === "ชำระแล้ว" ? (bill.updatedAt || bill.updated_at || "") : "",
          month: bill.month,
          year: bill.year
        };
      });
      setInvoices(invoices);
      // สร้าง monthYearList
      const months = Array.from(new Set(bills.map(b => `${b.month}/${b.year}`)));
      setMonthYearList(months);
      setSelectedMonthYear(months[0] ? String(months[0]) : "");
    });
  }, []);

  const filtered = invoices.filter(inv => `${inv.month}/${inv.year}` === selectedMonthYear);

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/40">
      <h2 className="text-3xl font-extrabold mb-6 text-slate-800 drop-shadow-lg tracking-tight text-center">สถานะการชำระเงิน</h2>
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 justify-between">
        <label htmlFor="monthYear" className="font-semibold text-slate-700">เลือกเดือน/ปี:</label>
        <select
          id="monthYear"
          className="rounded-lg px-4 py-2 border border-slate-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow transition-all text-lg"
          value={selectedMonthYear}
          onChange={e => setSelectedMonthYear(e.target.value)}
        >
          {monthYearList.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl shadow-inner">
        <table className="w-full border-collapse bg-white/60 backdrop-blur rounded-xl">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100/60 to-cyan-100/60 text-slate-700">
              <th className="p-3 border-b font-bold text-center">ห้อง</th>
              <th className="p-3 border-b font-bold text-center">ชื่อผู้เช่า</th>
              <th className="p-3 border-b font-bold text-center">ยอดเงิน</th>
              <th className="p-3 border-b font-bold text-center">สถานะ</th>
              <th className="p-3 border-b font-bold text-center">วันที่ชำระ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="text-center hover:bg-blue-50/60 transition-all">
                <td className="p-3 border-b font-medium">{inv.room}</td>
                <td className="p-3 border-b">{inv.name}</td>
                <td className="p-3 border-b">{inv.amount.toLocaleString()} <span className="text-xs text-slate-500">฿</span></td>
                <td className="p-3 border-b font-bold flex items-center justify-center gap-2">
                  {inv.status === "ชำระแล้ว" ? (
                    <span className="flex items-center gap-1 text-green-600"><FaCheckCircle className="inline-block" /> ชำระแล้ว</span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-500"><FaClock className="inline-block animate-pulse" /> รอชำระ</span>
                  )}
                </td>
                <td className="p-3 border-b">{inv.paidDate || <span className="text-slate-400">-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="text-center text-slate-500 py-6">ไม่มีข้อมูลในเดือนนี้</div>}
    </div>
  );
} 