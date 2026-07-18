import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middleware/auth.middleware.js";
import {
  createOrderController,
  getAllOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
  deleteOrderController,
  getDashboardOrdersController,
} from "../controller/order.controller.js";

const orderRoute = Router();

// ==========================================
// RENTING ORDERS
// ==========================================

// Dashboard enriched orders (any authenticated vendor)
orderRoute.get("/dashboard", verifyToken, getDashboardOrdersController);

// Get all orders (open to all authenticated users - could be restricted later)
orderRoute.get("/", verifyToken, getAllOrdersController);

// Get order by ID (open to all authenticated users)
orderRoute.get("/:rent_id", verifyToken, getOrderByIdController);

// Create a new order (Admin only according to requirements)
orderRoute.post("/", verifyAdmin, createOrderController);

// Update order status (Admin only)
orderRoute.put("/:rent_id/status", verifyAdmin, updateOrderStatusController);

// Delete an order (Admin only)
orderRoute.delete("/:rent_id", verifyAdmin, deleteOrderController);

export default orderRoute;
