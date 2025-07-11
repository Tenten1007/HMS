export interface ห้อง {
  id: number;
  ชื่อ: string;
}

export function แปลงแถวเป็นห้อง(row: any): ห้อง {
  return {
    id: row.id,
    ชื่อ: row.name,
  };
} 