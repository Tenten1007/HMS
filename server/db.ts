import { Pool } from "pg";
import "dotenv/config";

// ปรับ config ตาม env จริง หรือใช้ .env ในอนาคต
const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "hms",
  password: process.env.PGPASSWORD || "postgres",
  port: Number(process.env.PGPORT) || 5432,
});

export async function query(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    console.error("DB Query Error:", err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool; 