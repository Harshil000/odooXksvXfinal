import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import { initQdrantCollection } from "./src/service/qdrant.service.js";
// import { initCron } from "./src/cron/returnCron.js";

const PORT = Number(process.env.PORT || 3000);

console.log("[startup] DATABASE_URL is", process.env.DATABASE_URL ? "SET" : "NOT SET");

try {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    // Initialize Qdrant collection after server starts (non-blocking)
    initQdrantCollection();
    // Initialize return checks background cron job
    // initCron();
  });
} catch (err) {
  console.error("Startup error:", err);
  process.exit(1);
}
