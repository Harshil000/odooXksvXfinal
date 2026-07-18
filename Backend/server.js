import app from "./src/app.js";
import connectDB from "./src/config/database.js";


const PORT = Number(process.env.PORT || 3000);

try {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
} catch (err) {
  console.error(`Due to error: ${err.message}`);
  process.exit(1);
}
