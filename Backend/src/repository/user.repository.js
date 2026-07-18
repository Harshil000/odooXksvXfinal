import argon2 from "argon2";
import {
  createUserRecord,
  findUserByEmail as findUserByEmailFromStore,
  findUserById as findUserByIdFromStore,
} from "../database/fileStore.js";

export async function createUser({ full_name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const finalFullName = (full_name || "").trim();
  const passwordHash = await argon2.hash(password);

  const createdUser = await createUserRecord({
    full_name: finalFullName,
    email: normalizedEmail,
    password_hash: passwordHash,
  });

  return {
    id: createdUser.id,
    full_name: createdUser.full_name,
    email: createdUser.email,
    is_active: createdUser.is_active,
    created_at: createdUser.created_at,
  };
}

export async function findUserByEmail(email) {
  return findUserByEmailFromStore(email);
}

export async function findUserById(id) {
  return findUserByIdFromStore(id);
}
