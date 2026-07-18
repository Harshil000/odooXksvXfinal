import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createProductImage,
  getImagesByProductId,
  deleteProductImage,
  createAsset,
  getAssetsByProductId,
  getProductVariants,
  getProductsAttributes,
} from "../repository/product.repository.js";
import { indexProduct, searchProducts } from "../service/search.service.js";
import { deleteProductVector } from "../service/qdrant.service.js";

// ==========================================
// PRODUCTS
// ==========================================

export async function createProductController(req, res, next) {
  try {
    const { c_id, pname, description, to_publish, quantity, product_type, sales_price, cost_price, images } = req.body;

    if (!c_id) return res.status(400).json({ message: "Company ID (c_id) is required" });
    if (!pname || !pname.trim()) return res.status(400).json({ message: "Product name (pname) is required" });

    const productData = { pname, description, to_publish, quantity, product_type, sales_price, cost_price };
    const product = await createProduct(c_id, productData);

    // Handle optional base64 images in the same request for convenience
    const createdImages = [];
    if (images && Array.isArray(images)) {
      for (const base64Str of images) {
        if (typeof base64Str === "string") {
          const img = await createProductImage(product.p_id, base64Str);
          createdImages.push(img);
        }
      }
    }

    // Fire-and-forget: index the product in Qdrant asynchronously
    // Product creation is never blocked or failed by this step
    indexProduct(product).catch((err) =>
      console.error("[Search] Background indexing failed for product", product.p_id, err.message)
    );

    return res.status(201).json({ message: "Product created successfully", product, images: createdImages });
  } catch (error) {
    next(error);
  }
}

export async function getAllProductsController(req, res, next) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const products = await getAllProducts(limit, offset);
    const productIds = products.map(p => p.p_id);
    const attributes = await getProductsAttributes(productIds);
    return res.status(200).json({ products, attributes });
  } catch (error) {
    next(error);
  }
}

export async function getProductByIdController(req, res, next) {
  try {
    const { p_id } = req.params;
    if (!p_id) return res.status(400).json({ message: "Product ID is required" });

    const product = await getProductById(p_id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const images = await getImagesByProductId(p_id);

    // Fetch other products with the same name (variants)
    const variants = await getProductVariants(product.pname, product.c_id);
    const variantIds = variants.map(v => v.p_id);
    const attributes = await getProductsAttributes(variantIds);

    return res.status(200).json({ product, images, variants, attributes });
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(req, res, next) {
  try {
    const { p_id } = req.params;
    const { pname, description, to_publish, quantity, product_type, sales_price, cost_price } = req.body;

    if (!p_id) return res.status(400).json({ message: "Product ID is required" });
    if (!pname || !pname.trim()) return res.status(400).json({ message: "Product name is required" });

    const productData = { pname, description, to_publish, quantity, product_type, sales_price, cost_price };
    const product = await updateProduct(p_id, productData);

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Fire-and-forget: re-index the updated product in Qdrant
    indexProduct(product).catch((err) =>
      console.error("[Search] Background re-indexing failed for product", p_id, err.message)
    );

    return res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductController(req, res, next) {
  try {
    const { p_id } = req.params;
    if (!p_id) return res.status(400).json({ message: "Product ID is required" });

    const deleted = await deleteProduct(p_id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });

    // Fire-and-forget: remove the vector from Qdrant
    deleteProductVector(p_id).catch((err) =>
      console.error("[Search] Background vector deletion failed for product", p_id, err.message)
    );

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// SEARCH
// ==========================================

/**
 * GET /api/products/search?q=<query>
 * Hybrid search: vector similarity (Qdrant) + keyword (PostgreSQL ILIKE)
 * Keyword matches appear first, then vector matches, deduplicated by p_id.
 */
export async function searchProductsController(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Search query (q) is required" });
    }

    const results = await searchProducts(q.trim());
    return res.status(200).json({ query: q, count: results.length, products: results });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// PRODUCT IMAGES
// ==========================================

export async function createProductImageController(req, res, next) {
  try {
    const { p_id } = req.params;
    const { image_base64 } = req.body;

    if (!p_id) return res.status(400).json({ message: "Product ID is required" });
    if (!image_base64) return res.status(400).json({ message: "Image base64 string is required" });

    const image = await createProductImage(p_id, image_base64);
    return res.status(201).json({ message: "Product image uploaded successfully", image });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductImageController(req, res, next) {
  try {
    const { img_id } = req.params;
    if (!img_id) return res.status(400).json({ message: "Image ID is required" });

    const deleted = await deleteProductImage(img_id);
    if (!deleted) return res.status(404).json({ message: "Image not found" });

    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// ASSETS
// ==========================================

export async function createAssetController(req, res, next) {
  try {
    const { p_id } = req.params;
    const { qr } = req.body;

    if (!p_id) return res.status(400).json({ message: "Product ID (p_id) is required" });
    if (!qr) return res.status(400).json({ message: "QR string is required" });

    const asset = await createAsset(p_id, qr);
    return res.status(201).json({ message: "Asset created successfully", asset });
  } catch (error) {
    next(error);
  }
}

export async function getAssetsByProductIdController(req, res, next) {
  try {
    const { p_id } = req.params;
    if (!p_id) return res.status(400).json({ message: "Product ID (p_id) is required" });

    const assets = await getAssetsByProductId(p_id);
    return res.status(200).json({ assets });
  } catch (error) {
    next(error);
  }
}
