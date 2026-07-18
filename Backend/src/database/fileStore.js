import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

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
      return { 
        users: [], vendors: [], companies: [],
        attributes: [], attribute_keys: [], attribute_values: [],
        addresses: [], products: [], product_images: [],
        rent_plans: [], renting_orders: []
      };
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
    vendors: Array.isArray(data.vendors) ? data.vendors : [],
    companies: Array.isArray(data.companies) ? data.companies : [],
    attributes: Array.isArray(data.attributes) ? data.attributes : [],
    attribute_keys: Array.isArray(data.attribute_keys) ? data.attribute_keys : [],
    attribute_values: Array.isArray(data.attribute_values) ? data.attribute_values : [],
    addresses: Array.isArray(data.addresses) ? data.addresses : [],
    products: Array.isArray(data.products) ? data.products : [],
    product_images: Array.isArray(data.product_images) ? data.product_images : [],
    rent_plans: Array.isArray(data.rent_plans) ? data.rent_plans : [],
    renting_orders: Array.isArray(data.renting_orders) ? data.renting_orders : [],
  };
  initialized = true;
  activeDbPath = currentDbPath;
  return store;
}

export function getStore() {
  return store;
}

export async function saveStore() {
  await writeStoreFile(getDbPath(), store);
}

// ========================
// USERS
// ========================

export async function createUserRecord({ first_name, last_name, profile_image, email, password_hash }) {
  await initializeStore();
  const normalizedEmail = normalizeEmail(email);
  const existingUser = store.users.find(u => u.email === normalizedEmail);
  if (existingUser) {
    const error = new Error("Email already exists");
    error.status = 409;
    throw error;
  }
  const createdUser = {
    u_id: crypto.randomUUID(),
    first_name: String(first_name || "").trim(),
    last_name: String(last_name || "").trim(),
    profile_image,
    email: normalizedEmail,
    password: password_hash,
  };
  store.users.push(createdUser);
  await writeStoreFile(getDbPath(), store);
  return createdUser;
}

export async function findUserByEmail(email) {
  await initializeStore();
  const normalizedEmail = normalizeEmail(email);
  return store.users.find(u => u.email === normalizedEmail) || null;
}

export async function findUserById(u_id) {
  await initializeStore();
  return store.users.find(u => u.u_id === String(u_id)) || null;
}

// ========================
// COMPANIES
// ========================

export async function createCompanyRecord({ product_category, comp_prof_image, gst_no, cname, pincode, city, state, address_line1, address_line2 }) {
  await initializeStore();
  const createdCompany = {
    c_id: crypto.randomUUID(),
    product_category,
    comp_prof_image,
    gst_no,
    cname,
    pincode,
    city,
    state,
    address_line1,
    address_line2,
  };
  store.companies.push(createdCompany);
  await writeStoreFile(getDbPath(), store);
  return createdCompany;
}

export async function findCompanyById(c_id) {
  await initializeStore();
  return store.companies.find(c => c.c_id === String(c_id)) || null;
}

// ========================
// VENDORS
// ========================

export async function createVendorRecord({ first_name, last_name, profile_image, email, password_hash, c_id, role }) {
  await initializeStore();
  const normalizedEmail = normalizeEmail(email);
  const existingVendor = store.vendors.find(v => v.email === normalizedEmail);
  if (existingVendor) {
    const error = new Error("Email already exists");
    error.status = 409;
    throw error;
  }
  const createdVendor = {
    v_id: crypto.randomUUID(),
    first_name: String(first_name || "").trim(),
    last_name: String(last_name || "").trim(),
    profile_image,
    email: normalizedEmail,
    password: password_hash,
    c_id,
    role,
  };
  store.vendors.push(createdVendor);
  await writeStoreFile(getDbPath(), store);
  return createdVendor;
}

export async function findVendorByEmail(email) {
  await initializeStore();
  const normalizedEmail = normalizeEmail(email);
  return store.vendors.find(v => v.email === normalizedEmail) || null;
}

export async function findVendorById(v_id) {
  await initializeStore();
  return store.vendors.find(v => v.v_id === String(v_id)) || null;
}

export async function getStorePath() {
  await initializeStore();
  return getDbPath();
}
