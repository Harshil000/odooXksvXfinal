import jwt from "jsonwebtoken";

/**
 * Issues a signed JWT access token with all relevant user claims.
 * @param {object} payload - { id, email, is_active }
 * @returns {string} signed JWT
 */
export function issueAccessToken(payload) {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not set in environment");

  return jwt.sign(payload, secret, {
    expiresIn: "1d",
  });
}
