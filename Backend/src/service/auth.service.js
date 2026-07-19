import argon2 from "argon2";
import { findUserByEmail, updateUserPassword } from "../repository/user.repository.js";
import { findVendorByEmail, updateVendorPassword } from "../repository/vendor.repository.js";

function isArgon2Hash(value) {
  return typeof value === "string" && value.startsWith("$argon2");
}

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

  let isPasswordValid = false;

  if (isArgon2Hash(user.password)) {
    isPasswordValid = await argon2.verify(user.password, password);
  } else {
    isPasswordValid = user.password === password;

    if (isPasswordValid) {
      if (userType === "user") {
        await updateUserPassword(user.u_id, password);
      } else {
        await updateVendorPassword(user.v_id, password);
      }
    }
  }

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
