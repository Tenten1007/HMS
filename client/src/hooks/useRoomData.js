
import { useState, useEffect } from 'react';

export const useRoomData = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // ดึงข้อมูลห้องและบิลทั้งหมด
      const [roomsRes, billsRes] = await Promise.all([
        fetch('http://localhost:4000/api/rooms').then(res => res.json()),
        fetch('http://localhost:4000/api/bills').then(res => res.json())
      ]);
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
    };
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
    return rooms.reduce((total, room) => {
      if (room.tenant) {
        return total + room.rent + (room.totalUtilityCost || 0);
      }
      return total;
    }, 0);
  };

  const getOccupiedRooms = () => {
    return rooms.filter(room => room.tenant).length;
  };

  return {
    rooms,
    updateRoom,
    getTotalRevenue,
    getOccupiedRooms,
    loading
  };
};
