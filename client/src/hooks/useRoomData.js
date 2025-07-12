
import { useState, useEffect } from 'react';

export const useRoomData = () => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/rooms')
      .then(res => res.json())
      .then(data => {
        // แปลงข้อมูล backend (ภาษาไทย) ให้เหมาะกับ UI เดิม
        const mapped = data.map(room => ({
          id: room.id,
          number: room.ชื่อ,
          rent: 0, // ปรับตามข้อมูลจริงถ้ามี
          tenant: room.สถานะ === 'มีผู้เช่า' ? 'มีผู้เช่า' : '',
          phone: '',
          deposit: 0,
          electricUnits: 0,
          waterUnits: 0,
          electricCost: 0,
          waterCost: 0,
          totalUtilityCost: 0
        }));
        setRooms(mapped);
      });
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
    getOccupiedRooms
  };
};
