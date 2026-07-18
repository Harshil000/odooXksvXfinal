import dotenv from "dotenv";
import { initializeStore } from "../database/fileStore.js";
import { resolveDatabaseMode } from "../database/dbMode.js";

dotenv.config();

const connectDB = async () => {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    console.log("Using local auth database store at database/auth-store.json");
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString });
  await pool.query("SELECT 1");
  console.log("PostgreSQL connected");
};

export default connectDB;
