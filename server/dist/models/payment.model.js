export function toPayment(row) {
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
