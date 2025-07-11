export interface Payment {
  id: number;
  billId: number;
  amount: number;
  method: "cash" | "transfer";
  slipUrl?: string;
  note?: string;
  paidAt: Date;
  createdAt: Date;
}

export function toPayment(row: any): Payment {
  return {
    id: row.id,
    billId: row.bill_id,
    amount: row.amount,
    method: row.method,
    slipUrl: row.slip_url,
    note: row.note,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
} 