import argon2 from "argon2";
import { findUserByEmail } from "../repository/user.repository.js";

export async function authenticateUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  // Check if user is active
  if (!user.is_active) {
    const err = new Error("Your account has been deactivated");
    err.status = 403;
    throw err;
  }

  // Verify argon2 hash
  const isPasswordValid = await argon2.verify(user.password_hash, password);
  if (!isPasswordValid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  // Remove password_hash before returning user object
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
