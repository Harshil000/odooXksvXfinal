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
};

export const getPool = () => pool;

export default connectDB;
