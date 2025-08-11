import React, { useState, useEffect } from "react";
import GlassCard from "../components/GlassCard";
import { API_BASE_URL } from "../hooks/useApi";

const emptyTenant = {
  name: "",
  phone: "",
  startDate: "",
  endDate: "",
  note: "",
};

const glassModal =
  "backdrop-blur-md bg-white/60 border border-white/30 shadow-2xl rounded-2xl";
const glassOverlay =
  "fixed inset-0 z-50 flex items-center justify-center p-2 bg-gradient-to-br from-slate-200/60 via-white/40 to-slate-300/60";
const glassButton =
  "transition-all duration-150 px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-200/60";
const glassInput =
  "w-full rounded-lg border border-white/40 bg-white/60 backdrop-blur px-3 py-2 mb-1 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200/40";

// ฟังก์ชันแปลงวันที่เป็นรูปแบบ วัน เดือน(ไทย) ปี พ.ศ.
function formatThaiDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = d.getDate();
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

// ฟังก์ชันแปลงวันที่เป็น YYYY-MM-DD สำหรับ input type=date
const toDateInputValue = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 10);
};

// ฟังก์ชันจัดรูปแบบเบอร์โทรให้เป็น 0x-xxx-xxxx หรือ 08x-xxx-xxxx
function formatPhoneNumber(phone) {
  if (!phone) return "";
  // ลบ non-digit
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    // 08x-xxx-xxxx
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  } else if (digits.length === 9) {
    // 0x-xxx-xxxx
    return digits.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  return phone; // ถ้าไม่ตรง format
}

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editMode, setEditMode] = useState<"add" | "edit" | null>(null);
  const [tenantForm, setTenantForm] = useState(emptyTenant);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ดึงข้อมูลห้องพักจาก backend จริง
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/rooms`).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/tenants`).then(res => res.json())
    ]).then(([roomsData, tenantsData]) => {
      console.log("roomsData", roomsData);
      console.log("tenantsData", tenantsData);
      function toLocalDateString(date) {
        // คืนค่า yyyy-mm-dd ตาม local time
        const d = new Date(date);
        return d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0');
      }
      function isActiveTenant(tenant) {
        const today = new Date();
        const start = new Date(tenant.start_date);
        const end = tenant.end_date ? new Date(tenant.end_date) : null;
        today.setHours(0,0,0,0);
        start.setHours(0,0,0,0);
        if (end) end.setHours(0,0,0,0);
        const result = start.getTime() <= today.getTime() && (!end || today.getTime() <= end.getTime());
        console.log('isActiveTenant', {
          today: today.toISOString(),
          start: start.toISOString(),
          end: end ? end.toISOString() : null,
          result
        });
        return result;
      }
      // สร้าง lookup จาก tenants ที่ active
      const tenantLookup = {};
      tenantsData.forEach(t => {
        if (isActiveTenant(t)) {
          tenantLookup[t.room_id] = t;
        }
      });
      const mapped = roomsData.map(room => {
        return {
          id: room.id,
          name: room.ชื่อ,
          status: room.สถานะ,
          tenants: room.tenants || []
        };
      });
      console.log("mapped", mapped);
      setRooms(mapped);
    });
  }, []);

  // เปิดฟอร์มเพิ่มผู้เช่า
  const handleAddTenant = (room: typeof rooms[0]) => {
    setSelectedRoom(room);
    setTenantForm(emptyTenant);
    setEditMode("add");
  };

  // เปิดฟอร์มแก้ไขผู้เช่า
  const handleEditTenant = (room, tenant) => {
    setSelectedRoom(room);
    setTenantForm(tenant
      ? {
          ...tenant,
          startDate: toDateInputValue(tenant.startDate),
          endDate: toDateInputValue(tenant.endDate),
        }
      : emptyTenant
    );
    setEditMode("edit");
  };

  // บันทึกข้อมูลผู้เช่า (เพิ่ม/แก้ไข)
  const handleSaveTenant = async () => {
    if (!selectedRoom) return;
    if (editMode === "add") {
      await fetch(`${API_BASE_URL}/api/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          name: tenantForm.name,
          phone: tenantForm.phone,
          start_date: tenantForm.startDate,
          end_date: tenantForm.endDate || null,
          note: tenantForm.note
        })
      });
    } else if (editMode === "edit" && selectedRoom.tenant) {
      await fetch(`http://${API_BASE_URL}/api/tenants/${selectedRoom.tenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tenantForm.name,
          phone: tenantForm.phone,
          start_date: tenantForm.startDate,
          end_date: tenantForm.endDate || null,
          note: tenantForm.note
        })
      });
    }
    // ดึงข้อมูลใหม่จาก backend แล้ว setRooms/setEditMode/setSelectedRoom แทน reload
    const [roomsData, tenantsData] = await Promise.all([
      fetch(`${API_BASE_URL}/api/rooms`).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/tenants`).then(res => res.json())
    ]);
    // mapping logic เดิม
    function isActiveTenant(tenant) {
      const today = new Date();
      const start = new Date(tenant.start_date);
      const end = tenant.end_date ? new Date(tenant.end_date) : null;
      today.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      if (end) end.setHours(0,0,0,0);
      return start.getTime() <= today.getTime() && (!end || today.getTime() <= end.getTime());
    }
    const tenantLookup = {};
    tenantsData.forEach(t => {
      if (isActiveTenant(t)) {
        tenantLookup[t.room_id] = t;
      }
    });
    const mapped = roomsData.map(room => {
      return {
        id: room.id,
        name: room.ชื่อ,
        status: room.สถานะ,
        tenants: room.tenants || []
      };
    });
    setRooms(mapped);
    setEditMode(null);
    setSelectedRoom(null);
  };

  // ลบผู้เช่า
  const handleDeleteTenant = async (room, tenant) => {
    if (!room || !tenant) return;
    await fetch(`http://${API_BASE_URL}/api/tenants/${tenant.id}`, {
      method: "DELETE"
    });
    // ดึงข้อมูลใหม่จาก backend แล้ว setRooms/setEditMode/setSelectedRoom
    const [roomsData, tenantsData] = await Promise.all([
      fetch(`${API_BASE_URL}/api/rooms`).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/tenants`).then(res => res.json())
    ]);
    function isActiveTenant(tenant) {
      const today = new Date();
      const start = new Date(tenant.start_date);
      const end = tenant.end_date ? new Date(tenant.end_date) : null;
      today.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      if (end) end.setHours(0,0,0,0);
      return start.getTime() <= today.getTime() && (!end || today.getTime() <= end.getTime());
    }
    const tenantLookup = {};
    tenantsData.forEach(t => {
      if (isActiveTenant(t)) {
        if (!tenantLookup[t.room_id]) tenantLookup[t.room_id] = [];
        tenantLookup[t.room_id].push(t);
      }
    });
    const mapped = roomsData.map(room => {
      const tenants = tenantLookup[room.id] || [];
      return {
        id: room.id,
        name: room.ชื่อ,
        status: room.สถานะ,
        tenants: tenants.map(t => ({
          id: t.id,
          name: t.name,
          phone: t.phone,
          startDate: t.start_date,
          endDate: t.end_date,
          note: t.note
        }))
      };
    });
    setRooms(mapped);
    setConfirmDelete(false);
    setSelectedRoom(null);
    setEditMode(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-gradient-to-br from-blue-100/60 via-white/80 to-slate-100/60">
      <h2 className="text-3xl font-extrabold mb-8 text-slate-800 drop-shadow-lg tracking-wide">จัดการห้องพัก</h2>
      <GlassCard className="w-full max-w-2xl p-6 border border-white/30 bg-white/60 backdrop-blur-md shadow-xl">
        <div className="flex flex-col gap-3">
        {rooms.map((room) => (
            <button
              key={room.id}
              className={`flex flex-col items-start w-full px-6 py-4 rounded-xl border border-white/40 bg-white/50 backdrop-blur hover:bg-blue-100/60 transition-all shadow group ${room.status === "ว่าง" ? "hover:ring-2 hover:ring-green-200/60" : "hover:ring-2 hover:ring-red-200/60"}`}
              onClick={() => setSelectedRoom(room)}
            >
              <div className="flex w-full justify-between items-center">
                <span className="font-bold text-lg text-slate-700 group-hover:text-blue-700 transition">{room.name}</span>
                <span className={room.status === "ว่าง" ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                  {room.status}
                </span>
              </div>
              {room.tenants && room.tenants.length > 0 && (
                <div className="mt-2 text-sm text-slate-700 bg-blue-50/60 rounded p-2 w-full">
                  {room.tenants.map((tenant, idx) => (
                    <div key={tenant.id || idx} className="mb-2 last:mb-0 border-b last:border-b-0 border-blue-100 pb-1 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">👤</span>
                        <span>{tenant.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">📞</span>
                        <span>{formatPhoneNumber(tenant.phone)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">🗓️ เข้าอยู่:</span>
                        <span>{formatThaiDate(tenant.startDate)}</span>
                      </div>
                      {tenant.endDate && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">🗓️ สิ้นสุด:</span>
                          <span>{formatThaiDate(tenant.endDate)}</span>
                        </div>
                      )}
                      {tenant.note && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">📝</span>
                          <span>{tenant.note}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </button>
          ))}
                  </div>
      </GlassCard>
      {/* Modal แสดงรายละเอียดผู้เช่า */}
      {selectedRoom && !editMode && (
        <div className={glassOverlay}>
          <div className={`${glassModal} w-full max-w-sm p-8 relative`}>
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-2xl font-bold bg-white/40 rounded-full w-9 h-9 flex items-center justify-center shadow hover:scale-110 transition"
              onClick={() => setSelectedRoom(null)}
              aria-label="ปิด"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-5 text-blue-900 drop-shadow">{selectedRoom.name}</h3>
            <div className="mb-3">
              <span className="font-semibold">สถานะ: </span>
              <span className={selectedRoom.status === "ว่าง" ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{selectedRoom.status}</span>
            </div>
            {selectedRoom.tenants && selectedRoom.tenants.length > 0 ? (
              <div className="space-y-4 mb-6 text-slate-800">
                {selectedRoom.tenants.map((tenant, idx) => (
                  <div key={tenant.id || idx} className="border-b last:border-b-0 border-blue-100 pb-2 last:pb-0">
                    <div><span className="font-semibold">ชื่อผู้เข้าพัก: </span>{tenant.name}</div>
                    <div><span className="font-semibold">เบอร์โทร: </span>{formatPhoneNumber(tenant.phone)}</div>
                    <div><span className="font-semibold">วันเข้าอยู่: </span>{formatThaiDate(tenant.startDate)}</div>
                    {tenant.endDate && <div><span className="font-semibold">วันสิ้นสุดสัญญา: </span>{formatThaiDate(tenant.endDate)}</div>}
                    {tenant.note && <div><span className="font-semibold">หมายเหตุ: </span>{tenant.note}</div>}
                    <div className="flex gap-2 mt-2">
                      <button
                        className={`${glassButton} bg-yellow-400/80 hover:bg-yellow-500/90 text-white`}
                        onClick={() => handleEditTenant(selectedRoom, tenant)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className={`${glassButton} bg-red-500/80 hover:bg-red-600/90 text-white`}
                        onClick={() => handleDeleteTenant(selectedRoom, tenant)}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center mt-4">
                  <button
                    className={`${glassButton} bg-blue-500/80 hover:bg-blue-600/90 text-white`}
                    onClick={() => {
                      setEditMode("add");
                      setTenantForm(emptyTenant);
                    }}
                  >
                    เพิ่มผู้เข้าพัก
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="text-slate-500 italic mt-4 mb-6">ยังไม่มีผู้เข้าพัก</div>
                <div className="flex justify-center">
                  <button
                    className={`${glassButton} bg-blue-500/80 hover:bg-blue-600/90 text-white`}
                    onClick={() => {
                      setEditMode("add");
                      setTenantForm(emptyTenant);
                    }}
                  >
                    เพิ่มผู้เข้าพัก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal ฟอร์มเพิ่ม/แก้ไขผู้เช่า */}
      {editMode && (
        <div className={glassOverlay}>
          <div className={`${glassModal} w-full max-w-sm p-8 relative`}>
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-2xl font-bold bg-white/40 rounded-full w-9 h-9 flex items-center justify-center shadow hover:scale-110 transition"
              onClick={() => { setEditMode(null); setSelectedRoom(null); }}
              aria-label="ปิด"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-5 text-blue-900 drop-shadow">{editMode === "add" ? "เพิ่มผู้เข้าพัก" : "แก้ไขข้อมูลผู้เข้าพัก"}</h3>
            <form
              className="flex flex-col gap-4"
              onSubmit={e => { e.preventDefault(); handleSaveTenant(); }}
            >
              <label>
                <span className="block font-semibold mb-1">ชื่อผู้เข้าพัก</span>
                <input
                  className={glassInput}
                  value={tenantForm.name}
                  onChange={e => setTenantForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="ชื่อ-นามสกุล"
                />
              </label>
              <label>
                <span className="block font-semibold mb-1">เบอร์โทร</span>
                <input
                  className={glassInput}
                  value={tenantForm.phone}
                  onChange={e => setTenantForm(f => ({ ...f, phone: e.target.value }))}
                  required
                  placeholder="08x-xxx-xxxx"
                />
              </label>
              <label>
                <span className="block font-semibold mb-1">วันเข้าอยู่</span>
                <input
                  type="date"
                  className={glassInput}
                  value={tenantForm.startDate}
                  onChange={e => setTenantForm(f => ({ ...f, startDate: e.target.value }))}
                  required
                />
              </label>
              <label>
                <span className="block font-semibold mb-1">วันสิ้นสุดสัญญา</span>
                <input
                  type="date"
                  className={glassInput}
                  value={tenantForm.endDate}
                  onChange={e => setTenantForm(f => ({ ...f, endDate: e.target.value }))}
                  // ไม่ required สามารถเว้นว่างได้
                />
              </label>
              <label>
                <span className="block font-semibold mb-1">หมายเหตุ</span>
                <input
                  className={glassInput}
                  value={tenantForm.note}
                  onChange={e => setTenantForm(f => ({ ...f, note: e.target.value }))}
                  placeholder=""
                />
              </label>
              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  className={`${glassButton} bg-green-500/80 hover:bg-green-600/90 text-white`}
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  className={`${glassButton} bg-gray-200/80 hover:bg-gray-300/90 text-slate-700`}
                  onClick={() => { setEditMode(null); setSelectedRoom(null); }}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal ยืนยันลบ */}
      {confirmDelete && (
        <div className={glassOverlay}>
          <div className={`${glassModal} w-full max-w-xs p-8 relative text-center`}>
            <div className="mb-4 text-lg font-bold text-red-600">ยืนยันการลบผู้เข้าพัก</div>
            <div className="mb-6 text-slate-700">คุณต้องการลบข้อมูลผู้เข้าพักของ {selectedRoom?.name} หรือไม่?</div>
            <div className="flex gap-3 justify-center">
              <button
                className={`${glassButton} bg-red-500/80 hover:bg-red-600/90 text-white`}
                onClick={() => handleDeleteTenant(selectedRoom, selectedRoom?.tenant)}
              >
                ลบ
              </button>
              <button
                className={`${glassButton} bg-gray-200/80 hover:bg-gray-300/90 text-slate-700`}
                onClick={() => setConfirmDelete(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default RoomManagement; 