import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createQuotationController,
  getQuotationsController,
  getQuotationByIdController,
  confirmQuotationController,
  convertQuotationController
} from "../controller/quotation.controller.js";

const quotationRoute = Router();

// Protect all quotation endpoints (restricted to authenticated vendors)
quotationRoute.post("/", verifyToken, createQuotationController);
quotationRoute.get("/", verifyToken, getQuotationsController);
quotationRoute.get("/:q_id", verifyToken, getQuotationByIdController);
quotationRoute.put("/:q_id/confirm", verifyToken, confirmQuotationController);
quotationRoute.post("/:q_id/convert", verifyToken, convertQuotationController);

export default quotationRoute;
