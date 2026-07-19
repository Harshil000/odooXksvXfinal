import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT a.asset_id, a.qr FROM assets a WHERE p_id = '9b36e8c9-53b4-4545-a18f-bd3be880bf28' LIMIT 5;");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
