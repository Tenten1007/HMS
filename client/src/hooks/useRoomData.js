
import { useState, useEffect } from 'react';
import { API_BASE_URL } from './useApi';

export const useRoomData = () => {
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ดึงข้อมูลห้องและบิลทั้งหมด
      const [roomsResponse, billsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/rooms`),
        fetch(`${API_BASE_URL}/api/bills`)
      ]);

      if (!roomsResponse.ok) {
        throw new Error(`ไม่สามารถโหลดข้อมูลห้องได้: ${roomsResponse.status}`);
      }
      
      if (!billsResponse.ok) {
        throw new Error(`ไม่สามารถโหลดข้อมูลบิลได้: ${billsResponse.status}`);
      }

      const [roomsRes, billsRes] = await Promise.all([
        roomsResponse.json(),
        billsResponse.json()
      ]);
      setBills(billsRes);
      // หา bill ล่าสุดของแต่ละห้อง (ตาม year, month มากสุด)
      const latestBillByRoom = {};
      billsRes.forEach(bill => {
        if (!latestBillByRoom[bill.roomId]) {
          latestBillByRoom[bill.roomId] = bill;
        } else {
          const prev = latestBillByRoom[bill.roomId];
          if (
            bill.year > prev.year ||
            (bill.year === prev.year && bill.month > prev.month)
          ) {
            latestBillByRoom[bill.roomId] = bill;
          }
        }
      });
      // map rooms + เติมข้อมูลจาก bill ล่าสุด
      const mapped = roomsRes.map(room => {
        const bill = latestBillByRoom[room.id];
        // หาผู้เช่าปัจจุบัน (ถ้ามี)
        let tenant = '';
        if (room.tenants && room.tenants.length > 0) {
          tenant = room.tenants[0].name;
        }
        return {
          id: room.id,
          number: room.ชื่อ,
          rent: bill ? bill.roomRate : 0,
          tenant,
          phone: room.tenants && room.tenants[0] ? room.tenants[0].phone : '',
          deposit: 0, // ไม่มีใน schema
          electricUnits: bill ? bill.electricUsed : 0,
          waterUnits: bill ? bill.waterUsed : 0,
          electricCost: bill ? bill.electricUsed * bill.electricRate : 0,
          waterCost: bill ? bill.waterUsed * bill.waterRate : 0,
          totalUtilityCost: bill ? (bill.electricUsed * bill.electricRate + bill.waterUsed * bill.waterRate) : 0,
          status: room.สถานะ,
        };
      });
      setRooms(mapped);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateRoom = (roomId, updates) => {
    setRooms(prevRooms => 
      prevRooms.map(room => 
        room.id === roomId ? { ...room, ...updates } : room
      )
    );
  };

  const getTotalRevenue = () => {
    // Deprecated: Dashboard จะใช้ bills ตรง ๆ แทน
    return 0;
  };

  const getOccupiedRooms = () => {
    return rooms.filter(room => room.tenant).length;
  };

  return {
    rooms,
    bills,
    updateRoom,
    getTotalRevenue,
    getOccupiedRooms,
    loading,
    error,
    refetch: fetchData
  };
};
