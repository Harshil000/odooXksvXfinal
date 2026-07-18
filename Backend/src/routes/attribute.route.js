import { Router } from "express";
import { verifyAdmin } from "../middleware/auth.middleware.js";
import {
  createAttributeController,
  getAttributesController,
  updateAttributeController,
  deleteAttributeController,
  createAttributeKeyController,
  getAttributeKeysController,
  updateAttributeKeyController,
  deleteAttributeKeyController,
  createAttributeValueController,
  getAttributeValuesController,
  updateAttributeValueController,
  deleteAttributeValueController,
} from "../controller/attribute.controller.js";

const attributeRoute = Router();

// ==========================================
// ATTRIBUTES
// ==========================================

// Get all attributes for a product (Public or regular users)
attributeRoute.get("/product/:p_id", getAttributesController);

// Create a new attribute for a product (Admin only)
attributeRoute.post("/product/:p_id", verifyAdmin, createAttributeController);

// Update an attribute (Admin only)
attributeRoute.put("/:attri_id", verifyAdmin, updateAttributeController);

// Delete an attribute (Admin only)
attributeRoute.delete("/:attri_id", verifyAdmin, deleteAttributeController);

// ==========================================
// ATTRIBUTE KEYS
// ==========================================

// Get all keys for an attribute (Public or regular users)
attributeRoute.get("/:attri_id/keys", getAttributeKeysController);

// Create a new key for an attribute (Admin only)
attributeRoute.post("/:attri_id/keys", verifyAdmin, createAttributeKeyController);

// Update a key (Admin only)
attributeRoute.put("/keys/:key_id", verifyAdmin, updateAttributeKeyController);

// Delete a key (Admin only)
attributeRoute.delete("/keys/:key_id", verifyAdmin, deleteAttributeKeyController);

// ==========================================
// ATTRIBUTE VALUES
// ==========================================

// Get all values for a key (Public or regular users)
attributeRoute.get("/keys/:key_id/values", getAttributeValuesController);

// Create a new value for a key (Admin only)
attributeRoute.post("/keys/:key_id/values", verifyAdmin, createAttributeValueController);

// Update a value (Admin only)
attributeRoute.put("/values/:value_id", verifyAdmin, updateAttributeValueController);

// Delete a value (Admin only)
attributeRoute.delete("/values/:value_id", verifyAdmin, deleteAttributeValueController);

export default attributeRoute;
