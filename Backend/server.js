import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import { initQdrantCollection } from "./src/service/qdrant.service.js";

const PORT = Number(process.env.PORT || 3000);

try {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    // Initialize Qdrant collection after server starts (non-blocking)
    initQdrantCollection();
  });
} catch (err) {
  console.error(`Due to error: ${err.message}`);
  process.exit(1);
}
