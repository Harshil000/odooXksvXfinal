import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middleware/auth.middleware.js";
import {
  createOrderController,
  getAllOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
  deleteOrderController,
  getDashboardOrdersController,
  sendInvoiceController,
  getCustomerDetailsController,
  getMyOrderHistoryController,
} from "../controller/order.controller.js";

const orderRoute = Router();

// ==========================================
// RENTING ORDERS
// ==========================================

// Search customer by email
orderRoute.get("/customer/search", verifyToken, getCustomerDetailsController);

// Dashboard enriched orders (any authenticated vendor)
orderRoute.get("/dashboard", verifyToken, getDashboardOrdersController);

// Send invoice email to customer
orderRoute.post("/invoice/send", verifyAdmin, sendInvoiceController);

// Current customer's order history
orderRoute.get("/history/me", verifyToken, getMyOrderHistoryController);

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
