import { generateProductDescription, generateEmbedding, expandSearchQuery } from "./gemini.service.js";
import { upsertProductVector, searchSimilarProducts } from "./qdrant.service.js";
import { getPool } from "../config/database.js";

/**
 * Builds the full text block used to generate an embedding.
 * Combines vendor-entered data with AI-generated description for richer vectors.
 *
 * @param {{ pname: string, description?: string, product_type?: string, aiDescription?: string, attributes?: Array }} fields
 * @returns {string}
 */
function buildEmbeddingText({ pname, description, product_type, aiDescription, attributes }) {
  let formattedAttributes = "";
  if (Array.isArray(attributes) && attributes.length > 0) {
    formattedAttributes = attributes
      .filter(attr => attr.name && attr.values)
      .map(attr => `${attr.name}: ${attr.values}`)
      .join(", ");
  }

  return [pname, product_type, formattedAttributes, description, aiDescription]
    .filter(Boolean)
    .join(". ");
}

/**
 * Indexes a product into Qdrant after creation or update.
 *
 * Pipeline:
 *   1. Generate AI description via Gemini Flash
 *   2. Build embedding text from product fields + AI description
 *   3. Generate 768d embedding via Gemini text-embedding-004
 *   4. Upsert the vector into Qdrant with product metadata as payload
 *
 * Each step has a fallback — product creation is NEVER blocked if this fails.
 *
 * @param {object} product - Full product row returned from PostgreSQL
 * @param {Array} [attributes] - List of attributes (Brand, color, Size etc.)
 */
export async function indexProduct(product, attributes = []) {
  try {
    const { p_id, pname, description, product_type, c_id, to_publish } = product;

    // Step 1: Generate AI description (graceful fallback to null)
    const aiDescription = await generateProductDescription({
      pname,
      description,
      product_type,
      attributes,
    });

    // Step 2: Build the text block for embedding
    const embeddingText = buildEmbeddingText({
      pname,
      description,
      product_type,
      aiDescription,
      attributes,
    });

    // Step 3: Generate embedding vector (graceful fallback to skip)
    const vector = await generateEmbedding(embeddingText);
    if (!vector) {
      console.warn(`[Search] Skipping Qdrant upsert for "${pname}" (${p_id}) — embedding failed.`);
      return;
    }

    // Step 4: Upsert vector into Qdrant with payload for metadata filtering
    await upsertProductVector(p_id, vector, {
      p_id,
      c_id,
      pname,
      product_type: product_type || null,
      to_publish: to_publish ?? false,
    });

    console.log(`[Search] Product "${pname}" (${p_id}) indexed in Qdrant.`);
  } catch (error) {
    console.error(`[Search] Failed to index product ${product?.p_id}:`, error.message);
  }
}

/**
 * Searches for products using a hybrid vector + keyword strategy with query expansion.
 *
 * Pipeline:
 *   1. Expand query using Gemini (synonyms, abbreviations)
 *   2. Run Gemini embedding on the original query string (vector search)
 *   3. Run SQL ILIKE on pname/description using ALL expanded terms (keyword search)
 *   4. Run vector search and keyword search in parallel
 *   5. Fetch full product rows for vector hits
 *   6. Merge results: keyword matches first, then vector results, deduplicated by p_id
 *
 * @param {string} query - Raw user search query string
 * @returns {Promise<object[]>} Merged, deduplicated product list (max ~30 results)
 */
export async function searchProducts(query) {
  const pool = getPool();

  // --- Expand query to capture synonyms and abbreviations ---
  const expandedTerms = await expandSearchQuery(query);
  console.log(`[Search] Query "${query}" expanded to: [${expandedTerms.join(", ")}]`);

  // Build multi-term ILIKE condition: any term matching pname OR description
  const ilikeClauses = expandedTerms.map((_, i) => `(pname ILIKE $${i + 1} OR description ILIKE $${i + 1})`);
  const ilikeSQL = ilikeClauses.join(" OR ");
  const ilikeParams = expandedTerms.map((t) => `%${t}%`);

  // --- Run vector search and keyword search in parallel ---
  const [vectorHits, keywordRows] = await Promise.all([
    // Vector search via Qdrant
    (async () => {
      try {
        const queryVector = await generateEmbedding(query);
        if (!queryVector) return [];
        const hits = await searchSimilarProducts(queryVector, 20);
        // Filter out irrelevant results with a similarity score below 0.55
        return hits.filter(hit => hit.score >= 0.55);
      } catch (err) {
        console.warn("[Search] Vector search failed:", err.message);
        return [];
      }
    })(),

    // Keyword search via PostgreSQL ILIKE (with expanded terms)
    (async () => {
      try {
        const result = await pool.query(
          `SELECT p_id, c_id, pname, description, to_publish, quantity, product_type, sales_price, cost_price
           FROM products
           WHERE ${ilikeSQL}
           LIMIT 20`,
          ilikeParams
        );
        return result.rows;
      } catch (err) {
        console.warn("[Search] Keyword search failed:", err.message);
        return [];
      }
    })(),
  ]);

  // --- Fetch full product details for Qdrant vector results ---
  let vectorProducts = [];
  if (vectorHits.length > 0) {
    const vectorIds = vectorHits.map((r) => r.id);
    const placeholders = vectorIds.map((_, i) => `$${i + 1}`).join(", ");
    try {
      const result = await pool.query(
        `SELECT p_id, c_id, pname, description, to_publish, quantity, product_type, sales_price, cost_price
         FROM products WHERE p_id IN (${placeholders})`,
        vectorIds
      );
      // Preserve Qdrant's ranking order
      const productMap = Object.fromEntries(result.rows.map((p) => [p.p_id, p]));
      vectorProducts = vectorIds.map((id) => productMap[id]).filter(Boolean);
    } catch (err) {
      console.warn("[Search] Failed to fetch vector product details:", err.message);
    }
  }

  // --- Merge: keyword matches first (exact), then vector matches, deduplicated ---
  const seen = new Set();
  const merged = [];

  for (const product of keywordRows) {
    if (!seen.has(product.p_id)) {
      seen.add(product.p_id);
      merged.push({ ...product, match_type: "keyword" });
    }
  }

  for (const product of vectorProducts) {
    if (!seen.has(product.p_id)) {
      seen.add(product.p_id);
      merged.push({ ...product, match_type: "vector" });
    }
  }

  return merged;
}
