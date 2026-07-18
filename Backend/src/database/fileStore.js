import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_DB_PATH = path.resolve(
  process.cwd(),
  "database",
  "auth-store.json",
);

let store = null;
let initialized = false;
let activeDbPath = null;

function getDbPath() {
  return process.env.AUTH_DB_PATH || DEFAULT_DB_PATH;
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

async function ensureDirectory(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function readStoreFile(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { users: [] };
    }
    throw error;
  }
}

async function writeStoreFile(filePath, data) {
  await ensureDirectory(filePath);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function initializeStore() {
  const currentDbPath = getDbPath();

  if (initialized && activeDbPath === currentDbPath) {
    return store;
  }

  const data = await readStoreFile(currentDbPath);
  store = {
    users: Array.isArray(data.users) ? data.users : [],
  };
  initialized = true;
  activeDbPath = currentDbPath;
  return store;
}

export async function createUserRecord({ full_name, email, password_hash }) {
  await initializeStore();

  const normalizedEmail = normalizeEmail(email);
  const existingUser = store.users.find(
    (user) => user.email === normalizedEmail,
  );
  if (existingUser) {
    const error = new Error("Email already exists");
    error.status = 409;
    throw error;
  }

  const createdUser = {
    id: Date.now().toString(),
    full_name: String(full_name || "").trim(),
    email: normalizedEmail,
    password_hash,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.users.push(createdUser);
  await writeStoreFile(getDbPath(), store);
  return createdUser;
}

export async function findUserByEmail(email) {
  await initializeStore();
  const normalizedEmail = normalizeEmail(email);
  return store.users.find((user) => user.email === normalizedEmail) || null;
}

export async function findUserById(id) {
  await initializeStore();
  return store.users.find((user) => user.id === String(id)) || null;
}

export async function getStorePath() {
  await initializeStore();
  return getDbPath();
}
