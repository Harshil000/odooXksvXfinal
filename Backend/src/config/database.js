import dotenv from "dotenv";

dotenv.config();

let pool = null;

const connectDB = async () => {
  const connectionString = process.env.DATABASE_URL;
  const { Pool } = await import("pg");
  pool = new Pool({ connectionString });
  await pool.query("SELECT 1");
  console.log("PostgreSQL connected");
};

export const getPool = () => pool;

export default connectDB;
