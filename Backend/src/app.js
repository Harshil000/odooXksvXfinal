import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { handleError } from "./middleware/error.middleware.js";
import authRoute from "./routes/auth.route.js";
import profileRoute from "./routes/profile.route.js";
import attributeRoute from "./routes/attribute.route.js";
import productRoute from "./routes/product.route.js";
import rentPlanRoute from "./routes/rent_plan.route.js";
import orderRoute from "./routes/order.route.js";
import cartRoute from "./routes/cart.route.js";
import paymentRoute from "./routes/payment.route.js";
import deliveryRouteRoute from "./routes/deliveryRoute.route.js";
import quotationRoute from "./routes/quotation.route.js";
import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// HEALTH CHECK
// =========================
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// =========================
// API ROUTES
// =========================
app.use("/api/auth", authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/attributes", attributeRoute);
app.use("/api/products", productRoute);
app.use("/api/rent-plans", rentPlanRoute);
app.use("/api/orders", orderRoute);
app.use("/api/cart", cartRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/delivery-routes", deliveryRouteRoute);
app.use("/api/quotations", quotationRoute);

// =========================
// SERVE FRONTEND
// =========================
const frontendDist = path.resolve(__dirname, "../../Frontend/dist");
app.use(express.static(frontendDist));

// Catch-all: serve index.html for any non-API route (React Router SPA)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.use(handleError);
export default app;