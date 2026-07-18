import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  getCartController,
  addToCartController,
  updateCartItemController,
  deleteCartItemController,
  clearCartController,
} from "../controller/cart.controller.js";

const cartRoute = Router();

// ==========================================
// SHOPPING CART ROUTES
// ==========================================

// Get user cart items
cartRoute.get("/", verifyToken, getCartController);

// Add product to cart
cartRoute.post("/", verifyToken, addToCartController);

// Update item quantity/dates
cartRoute.put("/:cart_item_id", verifyToken, updateCartItemController);

// Remove item from cart
cartRoute.delete("/:cart_item_id", verifyToken, deleteCartItemController);

// Clear whole cart
cartRoute.delete("/", verifyToken, clearCartController);

export default cartRoute;
