import React, { useState, useEffect } from "react";
import GlassCard from "../components/GlassCard";

interface Bill {
  id: number;
  roomId: number;
  roomName?: string;
  month: number;
  year: number;
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
  status: "unpaid" | "paid" | "partial";
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: number;
  ชื่อ: string;
  สถานะ: string;
}

const BillStatus: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
    fetchRooms();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/bills");
      const data = await res.json();
      setBills(data);
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/rooms");
      const data = await res.json();
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBillStatus = async (billId: number, status: "unpaid" | "paid" | "partial") => {
    try {
      const res = await fetch(`http://localhost:4000/api/bills/${billId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        fetchBills(); // รีเฟรชข้อมูล
        alert("อัปเดตสถานะเรียบร้อยแล้ว!");
      }
    } catch (error) {
      console.error("Error updating bill status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "partial": return "bg-yellow-100 text-yellow-800";
      case "unpaid": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid": return "จ่ายแล้ว";
      case "partial": return "จ่ายบางส่วน";
      case "unpaid": return "ยังไม่จ่าย";
      default: return "ไม่ทราบสถานะ";
    }
  };

  const getRoomName = (bill: Bill) => {
    return bill.roomName || `ห้อง ${bill.roomId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 drop-shadow">สถานะการจ่ายเงิน</h2>
      
      <GlassCard className="w-full max-w-4xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">ห้อง</th>
                <th className="text-left py-3 px-4 font-semibold">เดือน/ปี</th>
                <th className="text-left py-3 px-4 font-semibold">จำนวนเงิน</th>
                <th className="text-left py-3 px-4 font-semibold">สถานะ</th>
                <th className="text-left py-3 px-4 font-semibold">วันที่สร้าง</th>
                <th className="text-left py-3 px-4 font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{getRoomName(bill)}</td>
                  <td className="py-3 px-4">{bill.month}/{bill.year}</td>
                  <td className="py-3 px-4 font-semibold">{bill.total.toLocaleString()} บาท</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {getStatusText(bill.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(bill.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={bill.status}
                      onChange={(e) => updateBillStatus(bill.id, e.target.value as "unpaid" | "paid" | "partial")}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="unpaid">ยังไม่จ่าย</option>
                      <option value="partial">จ่ายบางส่วน</option>
                      <option value="paid">จ่ายแล้ว</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {bills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ยังไม่มีบิลในระบบ
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default BillStatus; 