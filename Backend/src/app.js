import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleError } from "./middleware/error.middleware.js";
import authRoute from "./routes/auth.route.js";
import attributeRoute from "./routes/attribute.route.js";
import productRoute from "./routes/product.route.js";
import rentPlanRoute from "./routes/rent_plan.route.js";
import orderRoute from "./routes/order.route.js";
import cartRoute from "./routes/cart.route.js";
import morgan from "morgan";

const app = express();

const configuredOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (configuredOrigins.length === 0) return true;
  if (configuredOrigins.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  if (
    /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(
      origin,
    )
  )
    return true;
  return false;
};

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));

// =========================
// ROUTES
// =========================
app.use("/api/auth", authRoute);
app.use("/api/attributes", attributeRoute);
app.use("/api/products", productRoute);
app.use("/api/rent-plans", rentPlanRoute);
app.use("/api/orders", orderRoute);
app.use("/api/cart", cartRoute);
app.use(handleError);

export default app;