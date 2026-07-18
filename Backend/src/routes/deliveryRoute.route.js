import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middleware/auth.middleware.js";
import {
  getDailyRouteController,
  optimizeDailyRouteController,
  updateStopStatusController,
} from "../controller/deliveryRoute.controller.js";

const deliveryRoute = Router();

// ==========================================
// DAILY ROUTE OPERATIONS
// ==========================================

// Fetch daily route details (and lazy calculate if it does not exist)
deliveryRoute.get("/", verifyToken, getDailyRouteController);

// Force optimization/re-calculation of daily stops sequence (Admin only)
deliveryRoute.post("/optimize", verifyAdmin, optimizeDailyRouteController);

// Update a stop status (e.g. marking it arrived/completed/failed)
deliveryRoute.put("/stops/:stop_id", verifyToken, updateStopStatusController);

export default deliveryRoute;
