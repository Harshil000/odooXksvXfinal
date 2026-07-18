import { createUser, findUserById } from "../repository/user.repository.js";
import { authenticateUser } from "../service/auth.service.js";
import { issueAccessToken } from "../utils/token.util.js";
import { getAccessCookieOptions, getClearCookieOptions } from "../utils/cookie.util.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a clean user object for all responses (no password_hash)
// ─────────────────────────────────────────────────────────────────────────────
function formatUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    is_active: user.is_active,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build the JWT payload from user object
// ─────────────────────────────────────────────────────────────────────────────
function buildTokenPayload(user) {
  return {
    id: user.id,
    email: user.email,
    is_active: user.is_active,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export async function registerController(req, res, next) {
  try {
    const user = await createUser(req.body);

    const accessToken = issueAccessToken(buildTokenPayload(user));
    res.cookie("accessToken", accessToken, getAccessCookieOptions());

    return res.status(201).json({
      msg: "User registered successfully",
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export async function loginController(req, res, next) {
  const { email, password } = req.body;

  try {
    const user = await authenticateUser(email, password);

    const accessToken = issueAccessToken(buildTokenPayload(user));
    res.cookie("accessToken", accessToken, getAccessCookieOptions());

    return res.status(200).json({
      msg: "Login successful",
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected — requires verifyToken middleware)
// ─────────────────────────────────────────────────────────────────────────────
export async function getMeController(req, res, next) {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      authenticated: true,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
export async function logoutController(req, res) {
  // Use getClearCookieOptions() so flags match the set cookie exactly —
  // browsers only remove a cookie when path/domain/secure/sameSite match.
  res.clearCookie("accessToken", getClearCookieOptions());

  return res.status(200).json({ message: "Logged out successfully" });
}
