import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middleware/auth.middleware.js";
import {
  createProductController,
  getAllProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  createProductImageController,
  deleteProductImageController,
  searchProductsController,
  createAssetController,
  getAssetsByProductIdController,
} from "../controller/product.controller.js";

const productRoute = Router();

// ==========================================
// PRODUCTS
// ==========================================

// Search products (hybrid: vector + keyword) — must be BEFORE /:p_id to avoid route conflicts
productRoute.get("/search", verifyToken, searchProductsController);

// Get all products (open to all authenticated users)
productRoute.get("/", verifyToken, getAllProductsController);

// Get product by ID (open to all authenticated users)
productRoute.get("/:p_id", verifyToken, getProductByIdController);

// Create a new product (Admin only)
productRoute.post("/", verifyAdmin, createProductController);

// Update a product (Admin only)
productRoute.put("/:p_id", verifyAdmin, updateProductController);

// Delete a product (Admin only)
productRoute.delete("/:p_id", verifyAdmin, deleteProductController);

// ==========================================
// PRODUCT IMAGES
// ==========================================

// Upload new product image (Admin only)
productRoute.post("/:p_id/images", verifyAdmin, createProductImageController);

// Delete a product image (Admin only)
productRoute.delete("/images/:img_id", verifyAdmin, deleteProductImageController);

// ==========================================
// ASSETS
// ==========================================

// Get assets for a product
productRoute.get("/:p_id/assets", verifyToken, getAssetsByProductIdController);

// Create a new asset for a product
productRoute.post("/:p_id/assets", verifyAdmin, createAssetController);

export default productRoute;
