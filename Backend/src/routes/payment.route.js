import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
} from "../controller/payment.controller.js";

const paymentRoute = Router();

// Protect all payment routes with verifyToken middleware
paymentRoute.post("/create-order", verifyToken, createRazorpayOrderController);
paymentRoute.post("/verify", verifyToken, verifyRazorpayPaymentController);

export default paymentRoute;
