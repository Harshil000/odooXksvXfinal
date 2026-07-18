import argon2 from "argon2";
import { findUserByEmail } from "../repository/user.repository.js";
import { findVendorByEmail } from "../repository/vendor.repository.js";

export async function authenticateUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  
  // First, check if a standard user exists with this email
  let user = await findUserByEmail(normalizedEmail);
  let userType = "user";
  
  // If not found in users, check vendors
  if (!user) {
    user = await findVendorByEmail(normalizedEmail);
    userType = "vendor";
  }

  // If not found in either table, fail authentication
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  // Verify argon2 hash
  const isPasswordValid = await argon2.verify(user.password, password);
  if (!isPasswordValid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  // Remove password before returning user object
  const { password: _password, ...userWithoutPassword } = user;
  
  // Return the user with their type attached
  return { ...userWithoutPassword, user_type: userType };
}
