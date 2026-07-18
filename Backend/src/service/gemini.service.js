import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a rich, natural-language description for a rental product
 * using Gemini Flash. Falls back to null if the API call fails.
 *
 * @param {{ pname: string, description?: string, product_type?: string }} productInfo
 * @returns {Promise<string|null>}
 */
export async function generateProductDescription({ pname, description, product_type, attributes }) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Format attributes for prompt (e.g. [{"name": "Brand", "values": "Canon"}] -> "Brand: Canon")
    let formattedAttributes = "None provided";
    if (Array.isArray(attributes) && attributes.length > 0) {
      formattedAttributes = attributes
        .filter(attr => attr.name && attr.values)
        .map(attr => `${attr.name}: ${attr.values}`)
        .join("\n");
    }

    const prompt = `Generate a rich, natural-language product description for a rental listing.
Include the product name, type/category, key attributes, intended use cases, and common alternate 
names or search terms a buyer might use to find this item. Keep it under 150 words.

Product Name: ${pname}
Product Type: ${product_type || "General"}
Product Attributes:
${formattedAttributes}
Vendor Description: ${description || "Not provided"}

Write only the description text. No headers, labels, or markdown.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.warn("[Gemini] Description generation failed:", error.message);
    return null;
  }
}

/**
 * Generates a 768-dimensional embedding vector for the given text
 * using Gemini gemini-embedding-2.
 *
 * @param {string} text - The text to embed
 * @returns {Promise<number[]|null>} Float array of 768 dimensions, or null on failure
 */
export async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.warn("[Gemini] Embedding generation failed:", error.message);
    return null;
  }
}
