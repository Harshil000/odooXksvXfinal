/**
 * Decode JWT token payload without external dependencies
 * JWT format: header.payload.signature
 */
export function decodeToken(token) {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64 decode the payload
    const payload = parts[1];
    // Add padding if needed
    const padded = payload + "=".repeat(4 - (payload.length % 4));
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}
