import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const productsRes = await pool.query("SELECT p_id, pname, quantity, to_publish FROM products;");
    console.log("=== PRODUCTS ===");
    console.log(productsRes.rows);

    const assetsRes = await pool.query("SELECT a.asset_id, a.p_id, a.qr FROM assets a;");
    console.log("=== ASSETS ===");
    console.log(assetsRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
