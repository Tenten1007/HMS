export interface Bill {
  id: number;
  roomId: number;
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
  createdAt: Date;
  updatedAt: Date;
}

export function toBill(row: any): Bill {
  return {
    id: row.id,
    roomId: row.room_id,
    month: row.month,
    year: row.year,
    roomRate: row.room_rate,
    waterPrev: row.water_prev,
    waterCurr: row.water_curr,
    waterUsed: row.water_used,
    waterRate: row.water_rate,
    electricPrev: row.electric_prev,
    electricCurr: row.electric_curr,
    electricUsed: row.electric_used,
    electricRate: row.electric_rate,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
} 