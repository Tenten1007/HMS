export interface Bill {
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

export function toBill(row: any): Bill {
  return {
    id: row.id,
    roomId: row.room_id,
    roomName: row.room_name,
    month: row.month,
    year: row.year,
    roomRate: Number(row.room_rate),
    waterPrev: Number(row.water_prev),
    waterCurr: Number(row.water_curr),
    waterUsed: Number(row.water_used),
    waterRate: Number(row.water_rate),
    electricPrev: Number(row.electric_prev),
    electricCurr: Number(row.electric_curr),
    electricUsed: Number(row.electric_used),
    electricRate: Number(row.electric_rate),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paidAmount: row.paid_amount !== undefined ? Number(row.paid_amount) : 0, // เพิ่ม mapping
  };
} 