import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION = process.env.QDRANT_COLLECTION || "odooXksv";
const VECTOR_SIZE = 3072; // Gemini gemini-embedding-2 output dimensions

let client = null;

/**
 * Returns the singleton Qdrant client instance.
 */
function getClient() {
  if (!client) {
    client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }
  return client;
}

/**
 * Ensures the Qdrant collection exists with the correct vector configuration.
 * Creates it with Cosine distance and 3072 dimensions if not found.
 * Re-creates if dimension mismatch is detected (self-healing).
 * Called once on server startup.
 */
export async function initQdrantCollection() {
  try {
    const qdrant = getClient();
    const { collections } = await qdrant.getCollections();
    const exists = collections.some((c) => c.name === COLLECTION);

    if (exists) {
      // Check collection details to ensure size matches
      const info = await qdrant.getCollection(COLLECTION);
      const currentSize = info.config?.params?.vectors?.size;
      
      if (currentSize !== VECTOR_SIZE) {
        console.log(`[Qdrant] Dimension mismatch (current: ${currentSize}d, target: ${VECTOR_SIZE}d). Re-creating collection...`);
        await qdrant.deleteCollection(COLLECTION);
        await qdrant.createCollection(COLLECTION, {
          vectors: {
            size: VECTOR_SIZE,
            distance: "Cosine",
          },
        });
        console.log(`[Qdrant] Collection "${COLLECTION}" re-created (${VECTOR_SIZE}d, Cosine).`);
      } else {
        console.log(`[Qdrant] Collection "${COLLECTION}" is ready.`);
      }
    } else {
      await qdrant.createCollection(COLLECTION, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      console.log(`[Qdrant] Collection "${COLLECTION}" created (${VECTOR_SIZE}d, Cosine).`);
    }
  } catch (error) {
    console.error("[Qdrant] Failed to initialize collection:", error.message);
  }
}

/**
 * Upserts a product's embedding vector into Qdrant.
 * Updates the point if the product already exists.
 *
 * @param {string} productId - The product UUID (used as the Qdrant point ID)
 * @param {number[]} vector - 768-dimensional float embedding
 * @param {object} payload - Metadata stored alongside the vector for filtering/display
 */
export async function upsertProductVector(productId, vector, payload) {
  const qdrant = getClient();
  await qdrant.upsert(COLLECTION, {
    wait: true,
    points: [
      {
        id: productId,
        vector,
        payload,
      },
    ],
  });
}

/**
 * Searches Qdrant for the most semantically similar products to a query vector.
 *
 * @param {number[]} queryVector - 768-dimensional query embedding
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array<{ id: string, score: number }>>}
 */
export async function searchSimilarProducts(queryVector, limit = 20) {
  const qdrant = getClient();
  const results = await qdrant.search(COLLECTION, {
    vector: queryVector,
    limit,
    with_payload: false,
  });
  return results.map((r) => ({ id: r.id, score: r.score }));
}

/**
 * Removes a product's vector from Qdrant when the product is deleted.
 * Fails silently to avoid blocking product deletion.
 *
 * @param {string} productId - The product UUID
 */
export async function deleteProductVector(productId) {
  try {
    const qdrant = getClient();
    await qdrant.delete(COLLECTION, {
      wait: true,
      points: [productId],
    });
    console.log(`[Qdrant] Vector for product ${productId} deleted.`);
  } catch (error) {
    console.warn(`[Qdrant] Failed to delete vector for product ${productId}:`, error.message);
  }
}
