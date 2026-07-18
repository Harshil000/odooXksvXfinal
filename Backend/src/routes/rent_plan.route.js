import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middleware/auth.middleware.js";
import {
  createRentPlanController,
  getRentPlansController,
  updateRentPlanController,
  deleteRentPlanController,
} from "../controller/rent_plan.controller.js";

const rentPlanRoute = Router();

// ==========================================
// RENT PLANS
// ==========================================

// Get rent plans for a product (open to all authenticated users)
rentPlanRoute.get("/product/:p_id", verifyToken, getRentPlansController);

// Create a new rent plan (Admin only)
rentPlanRoute.post("/product/:p_id", verifyAdmin, createRentPlanController);

// Update a rent plan (Admin only)
rentPlanRoute.put("/:r_id", verifyAdmin, updateRentPlanController);

// Delete a rent plan (Admin only)
rentPlanRoute.delete("/:r_id", verifyAdmin, deleteRentPlanController);

export default rentPlanRoute;
