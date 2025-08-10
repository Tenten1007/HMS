import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaClock, FaMoneyCheckAlt, FaPaperclip, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import BillTemplate from "../components/BillTemplate";
import { useIsMobile } from "../hooks/use-mobile";
import { useOrientation } from "../hooks/useOrientation";

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
  paidAmount?: number; // เพิ่ม field นี้
}

interface Room {
  id: number;
  ชื่อ: string;
  สถานะ: string;
}

const BillStatus: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const activeRooms = rooms.filter((r: any) => r.isActive);
  const [loading, setLoading] = useState(true);
  const [selectedMonthYear, setSelectedMonthYear] = useState("");
  const [monthYearList, setMonthYearList] = useState<{ yearMap: Record<string, string[]>, sortedYears: string[] }>({ yearMap: {}, sortedYears: [] });
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const isMobile = useIsMobile();
  const orientation = useOrientation();

  useEffect(() => {
    fetchBills();
    fetchRooms();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch("http://hms-backend-zx75.onrender.com/api/bills");
      const data = await res.json();
      setBills(data);

      // optgroup + default เป็นเดือน/ปีปัจจุบัน
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const yearMap: Record<string, string[]> = {};
      data.forEach((b: Bill) => {
        const y = String(b.year);
        const m = String(Number(b.month));
        if (!yearMap[y]) yearMap[y] = [];
        if (!yearMap[y].includes(m)) yearMap[y].push(m);
      });
      Object.keys(yearMap).forEach(y => yearMap[y].sort((a, b) => Number(a) - Number(b)));
      const sortedYears = Object.keys(yearMap).sort((a, b) => Number(b) - Number(a));
      let defaultMonthYear = `${currentMonth}/${currentYear}`;
      if (!Object.entries(yearMap).some(([y, ms]) => y === String(currentYear) && ms.includes(String(currentMonth)))) {
        defaultMonthYear = sortedYears.length ? `${yearMap[sortedYears[0]][0]}/${sortedYears[0]}` : '';
      }
      setMonthYearList({ yearMap, sortedYears });
      setSelectedMonthYear(defaultMonthYear);
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch("http://hms-backend-zx75.onrender.com/api/rooms");
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
      const res = await fetch(`http://hms-backend-zx75.onrender.com/api/bills/${billId}`, {
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

  const deleteBill = async (billId: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบบิลนี้?")) {
      return;
    }

    try {
      const res = await fetch(`http://hms-backend-zx75.onrender.com/api/bills/${billId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchBills(); // รีเฟรชข้อมูล
        alert("ลบบิลเรียบร้อยแล้ว!");
      } else {
        throw new Error("Failed to delete bill");
      }
    } catch (error) {
      console.error("Error deleting bill:", error);
      alert("เกิดข้อผิดพลาดในการลบบิล");
    }
  };

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingBill(null);
    setShowEditModal(false);
  };

  const updateBill = async (updatedBill: Partial<Bill>) => {
    if (!editingBill) return;

    try {
      const res = await fetch(`http://hms-backend-zx75.onrender.com/api/bills/${editingBill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedBill, paidAmount: editingBill.paidAmount ?? 0 }),
      });
      
      if (res.ok) {
        fetchBills(); // รีเฟรชข้อมูล
        closeEditModal();
        alert("อัปเดตบิลเรียบร้อยแล้ว!");
      } else {
        throw new Error("Failed to update bill");
      }
    } catch (error) {
      console.error("Error updating bill:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตบิล");
    }
  };

  const openPreviewModal = (bill: Bill) => {
    setPreviewBill(bill);
    setShowPreviewModal(true);
  };

  const closePreviewModal = () => {
    setPreviewBill(null);
    setShowPreviewModal(false);
  };

  const handleDownloadFromBackend = async (format: "pdf" | "png") => {
    if (!previewBill) return;

    const waterUsed = Math.max(0, previewBill.waterCurr - previewBill.waterPrev);
    const electricUsed = Math.max(0, previewBill.electricCurr - previewBill.electricPrev);
    const bill = {
      roomName: previewBill.roomName || `ห้อง ${previewBill.roomId}`,
      roomRate: previewBill.roomRate,
      waterPrev: previewBill.waterPrev,
      waterCurr: previewBill.waterCurr,
      waterUsed,
      waterRate: previewBill.waterRate,
      electricPrev: previewBill.electricPrev,
      electricCurr: previewBill.electricCurr,
      electricUsed,
      electricRate: previewBill.electricRate,
      total: previewBill.total,
      billDate: `${previewBill.year}-${String(previewBill.month).padStart(2, '0')}-01`,
    };

    try {
      const res = await fetch("http://hms-backend-zx75.onrender.com/api/generate-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill, format }),
      });
      
      if (res.ok) {
        const blob = await res.blob();
        // ดึงชื่อไฟล์จาก header
        let filename = format === "pdf" ? "bill.pdf" : "bill.png";
        const disposition = res.headers.get("Content-Disposition");
        if (disposition && disposition.includes("filename=")) {
          filename = disposition.split("filename=")[1].replace(/["]+/g, "");
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to generate bill");
      }
    } catch (error) {
      console.error("Error generating bill:", error);
      alert("เกิดข้อผิดพลาดในการสร้างบิล");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-green-600";
      case "partial": return "text-yellow-600";
      case "unpaid": return "text-orange-500";
      default: return "text-gray-600";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <FaCheckCircle className="inline-block" />;
      case "partial": return <FaMoneyCheckAlt className="inline-block" />;
      case "unpaid": return <FaClock className="inline-block animate-pulse" />;
      default: return <FaClock className="inline-block" />;
    }
  };

  const getRoomName = (bill: Bill) => {
    return bill.roomName || `ห้อง ${bill.roomId}`;
  };

  // filter
  const filteredBills = bills.filter(
    bill => `${Number(bill.month)}/${bill.year}` === selectedMonthYear
  );

  // เพิ่มฟังก์ชันสำหรับส่งบิลเข้าไลน์กลุ่ม
  const handleSendBillsToLine = async () => {
    if (!window.confirm("ยืนยันส่งบิลเข้าไลน์กลุ่มสำหรับเดือน/ปีนี้?")) return;
    try {
      const [month, year] = selectedMonthYear.split("/");
      const res = await fetch("http://hms-backend-zx75.onrender.com/api/send-bills-to-line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year })
      });
      if (res.ok) {
        alert("ส่งบิลเข้าไลน์กลุ่มสำเร็จ!");
      } else {
        const data = await res.json();
        alert("เกิดข้อผิดพลาด: " + (data.error || "ไม่สามารถส่งบิลได้"));
      }
    } catch (e: any) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  // เพิ่มอ่านเบอร์พร้อมเพย์จาก env
  const PROMPTPAY_NUMBER = import.meta.env.VITE_PROMPTPAY_NUMBER || "0800000000";

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/40">
      {/* Overlay แจ้งเตือนการหมุนจอ */}
      {isMobile && orientation === "portrait" && !showEditModal && !showPreviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-lg font-bold mb-2">แนะนำให้หมุนจอเป็นแนวนอน</div>
            <div className="text-gray-500">เพื่อดูตารางข้อมูลได้เต็มหน้าจอ</div>
          </div>
        </div>
      )}
      {isMobile && orientation === "landscape" && (showEditModal || showPreviewModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-lg font-bold mb-2">แนะนำให้หมุนจอเป็นแนวตั้ง</div>
            <div className="text-gray-500">เพื่อดูข้อมูลบิลหรือแก้ไขได้สะดวกขึ้น</div>
          </div>
        </div>
      )}
      <h2 className="text-3xl font-extrabold mb-6 text-slate-800 drop-shadow-lg tracking-tight text-center">สถานะการจ่ายเงิน</h2>
      
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 justify-between">
        <label htmlFor="monthYear" className="font-semibold text-slate-700">เลือกเดือน/ปี:</label>
        <select
          id="monthYear"
          className="rounded-lg px-4 py-2 border border-slate-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow transition-all text-lg"
          value={selectedMonthYear}
          onChange={e => setSelectedMonthYear(e.target.value)}
        >
          {monthYearList.sortedYears.map(year => (
            <optgroup key={year} label={`ปี ${year}`}>
              {monthYearList.yearMap[year].map(month => {
                const value = `${month}/${year}`;
                return (
                  <option key={value} value={value}>
                    {`เดือน ${month}/${year}`}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
        <button
          onClick={handleSendBillsToLine}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow text-base font-semibold"
        >
          ส่งบิลเข้าไลน์กลุ่ม
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-inner">
        <table className="w-full border-collapse bg-white/60 backdrop-blur rounded-xl">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100/60 to-cyan-100/60 text-slate-700">
              <th className="p-3 border-b font-bold text-center">ห้อง</th>
              <th className="p-3 border-b font-bold text-center">เดือน/ปี</th>
              <th className="p-3 border-b font-bold text-center">ยอดเงิน</th>
              <th className="p-3 border-b font-bold text-center">วันที่สร้าง</th>
              <th className="p-3 border-b font-bold text-center">สถานะ</th>
              <th className="p-3 border-b font-bold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill) => (
              <tr key={bill.id} className="text-center hover:bg-blue-50/60 transition-all">
                <td className="p-3 border-b font-medium">{getRoomName(bill)}</td>
                <td className="p-3 border-b">{bill.month}/{bill.year}</td>
                <td className="p-3 border-b font-semibold whitespace-nowrap overflow-hidden" style={{maxWidth: 180, fontFamily: 'Sarabun, Tahoma, Arial, sans-serif'}}>
                  <span className="font-normal">{Number(bill.total).toLocaleString('en-US', { maximumFractionDigits: 0 })} ฿</span>
                  {bill.status === 'partial' &&bill.paidAmount && bill.paidAmount > 0 && (
                    <span className="ml-1 text-[11px] text-green-700 font-normal">· จ่าย {Number(bill.paidAmount).toLocaleString('en-US', { maximumFractionDigits: 0 })}฿</span>
                  )}
                  {bill.status === 'partial' && bill.paidAmount && bill.paidAmount > 0 && bill.paidAmount < bill.total && (
                    <span className="ml-1 text-[11px] text-red-600 font-normal">· เหลือ {(Number(bill.total) - Number(bill.paidAmount)).toLocaleString('en-US', { maximumFractionDigits: 0 })}฿</span>
                  )}
                </td>
                <td className="p-3 border-b text-gray-600">
                  {new Date(bill.createdAt).toLocaleDateString('th-TH')}
                </td>
                <td className="p-3 border-b font-bold text-center whitespace-nowrap" style={{minWidth: 120, height: 32}}>
                  <span className={`inline-flex items-center gap-1 text-sm ${getStatusColor(bill.status)}`}>
                    {getStatusIcon(bill.status)}
                    {getStatusText(bill.status)}
                  </span>
                </td>
                <td className="p-3 border-b">
                  <div className="flex items-center justify-center gap-2">
                    <select
                      value={bill.status}
                      onChange={(e) => updateBillStatus(bill.id, e.target.value as "unpaid" | "paid" | "partial")}
                      className="text-xs border rounded px-2 py-1 bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    >
                      <option value="unpaid">ยังไม่จ่าย</option>
                      <option value="partial">จ่ายบางส่วน</option>
                      <option value="paid">จ่ายแล้ว</option>
                    </select>
                    <button
                      onClick={() => openPreviewModal(bill)}
                      className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                      title="ดูบิลตัวอย่าง"
                    >
                      <FaEye className="text-sm" />
                    </button>
                    <button
                      onClick={() => openEditModal(bill)}
                      className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      title="แก้ไขบิล"
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      onClick={() => deleteBill(bill.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="ลบบิล"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredBills.length === 0 && (
        <div className="text-center text-slate-500 py-6">
          {selectedMonthYear ? "ไม่มีข้อมูลในเดือนนี้" : "ยังไม่มีบิลในระบบ"}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">แก้ไขบิล</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ห้อง</label>
                <input
                  type="text"
                  value={editingBill.roomName || `ห้อง ${editingBill.roomId}`}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">เดือน</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={editingBill.month}
                    onChange={(e) => setEditingBill({...editingBill, month: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ปี</label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={editingBill.year}
                    onChange={(e) => setEditingBill({...editingBill, year: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ค่าน้ำ เดือนที่แล้ว</label>
                  <input
                    type="number"
                    value={editingBill.waterPrev}
                    onChange={(e) => setEditingBill({...editingBill, waterPrev: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ค่าน้ำ เดือนนี้</label>
                  <input
                    type="number"
                    value={editingBill.waterCurr}
                    onChange={(e) => setEditingBill({...editingBill, waterCurr: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ค่าไฟ เดือนที่แล้ว</label>
                  <input
                    type="number"
                    value={editingBill.electricPrev}
                    onChange={(e) => setEditingBill({...editingBill, electricPrev: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ค่าไฟ เดือนนี้</label>
                  <input
                    type="number"
                    value={editingBill.electricCurr}
                    onChange={(e) => setEditingBill({...editingBill, electricCurr: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              {editingBill.status === 'partial' && (
                <div>
                  <label className="block text-sm font-medium mb-1">จำนวนเงินที่จ่ายแล้ว (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    max={editingBill.total}
                    value={editingBill.paidAmount ?? 0}
                    onChange={(e) => {
                      let v = Number(e.target.value);
                      if (v > editingBill.total) v = editingBill.total;
                      if (v < 0) v = 0;
                      setEditingBill({ ...editingBill, paidAmount: v });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  <div className="text-xs text-slate-500 mt-1">ยอดคงเหลือ: <span className="text-red-600 font-normal">{(editingBill.total - (editingBill.paidAmount ?? 0)).toLocaleString()} บาท</span></div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => updateBill(editingBill)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  บันทึก
                </button>
                <button
                  onClick={closeEditModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="flex flex-col items-center justify-center w-full max-h-[95vh] overflow-y-auto">
            <div
              className="bg-white rounded-2xl shadow-lg"
              style={{ width: 360, maxWidth: "100vw", margin: 0, padding: 0 }}
            >
              <BillTemplate
                roomName={previewBill.roomName || `ห้อง ${previewBill.roomId}`}
                roomRate={previewBill.roomRate}
                waterPrev={previewBill.waterPrev}
                waterCurr={previewBill.waterCurr}
                waterUsed={Math.max(0, previewBill.waterCurr - previewBill.waterPrev)}
                waterRate={previewBill.waterRate}
                electricPrev={previewBill.electricPrev}
                electricCurr={previewBill.electricCurr}
                electricUsed={Math.max(0, previewBill.electricCurr - previewBill.electricPrev)}
                electricRate={previewBill.electricRate}
                total={previewBill.total}
                billDate={`${previewBill.year}-${String(previewBill.month).padStart(2, '0')}-01`}
                promptpayNumber={PROMPTPAY_NUMBER}
                paidAmount={previewBill.paidAmount}
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
                onClick={closePreviewModal}
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

export default BillStatus; 