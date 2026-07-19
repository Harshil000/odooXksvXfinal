import dotenv from "dotenv";

dotenv.config();

let pool = null;

const connectDB = async () => {
  const connectionString = process.env.DATABASE_URL;
  const { Pool } = await import("pg");
  pool = new Pool({ connectionString });
  await pool.query("SELECT 1");
  console.log("PostgreSQL connected");
  
  // Create password_resets table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      email VARCHAR(255) PRIMARY KEY,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Alter total_distance_km column type to unrestricted NUMERIC
  try {
    await pool.query("ALTER TABLE delivery_routes ALTER COLUMN total_distance_km TYPE NUMERIC;");
  } catch (err) {
    console.error("Failed to alter delivery_routes column type:", err.message);
  }

  // Fix oversized BTree index on assets.qr column
  try {
    // Drop old oversized index if it exists
    await pool.query(`DROP INDEX IF EXISTS assets_qr_unique_idx;`);

    // Strip any existing base64 SVG blobs stored in the qr column back to plain asset codes
    // Codes are embedded in the SVG <text> element
    await pool.query(`
      UPDATE assets
      SET qr = (
        SELECT (regexp_match(convert_from(decode(split_part(qr, ',', 2), 'base64'), 'UTF8'), '<text[^>]*>([^<]+)</text>'))[1]
      )
      WHERE qr LIKE 'data:image/svg+xml;base64,%'
        AND (
          regexp_match(convert_from(decode(split_part(qr, ',', 2), 'base64'), 'UTF8'), '<text[^>]*>([^<]+)</text>')
        ) IS NOT NULL;
    `);

    // Add a sensible unique index using MD5 hash (always fits in BTree)
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS assets_qr_hash_unique_idx
      ON assets (MD5(qr));
    `);
    console.log('[DB] assets_qr index migrated successfully.');
  } catch (err) {
    console.error('Failed to migrate assets_qr index:', err.message);
  }
};

export const getPool = () => pool;

export default connectDB;
