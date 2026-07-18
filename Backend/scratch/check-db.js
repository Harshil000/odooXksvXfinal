import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('payments', 'refunds', 'renting_orders');
    `);
    console.log("Existing tables:", res.rows.map(r => r.table_name));

    if (res.rows.some(r => r.table_name === 'renting_orders')) {
      const colRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'renting_orders' 
        AND column_name IN ('payment_status', 'deposit_amount', 'deposit_refunded_amount');
      `);
      console.log("Renting orders columns:", colRes.rows);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
