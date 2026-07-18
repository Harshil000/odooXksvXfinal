import crypto from "node:crypto";
import { getPool } from "../config/database.js";
import { resolveDatabaseMode } from "../database/dbMode.js";
import { initializeStore, getStore, saveStore } from "../database/fileStore.js";
import {
  INSERT_RENT_PLAN_QUERY,
  SELECT_RENT_PLANS_BY_PRODUCT_ID_QUERY,
  UPDATE_RENT_PLAN_QUERY,
  DELETE_RENT_PLAN_QUERY,
} from "../queries/rent_plan.query.js";

// ==========================================
// RENT PLANS
// ==========================================

export async function createRentPlan(p_id, planData) {
  const { deposit, penalty, price, duration_type, pickup_time, return_time } = planData;
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const newPlan = {
      r_id: crypto.randomUUID(),
      p_id,
      deposit: Number(deposit || 0),
      penalty: Number(penalty || 0),
      price: Number(price),
      duration_type,
      pickup_time: pickup_time || null,
      return_time: return_time || null,
    };
    store.rent_plans.push(newPlan);
    await saveStore();
    return newPlan;
  }

  const pool = getPool();
  const result = await pool.query(INSERT_RENT_PLAN_QUERY, [
    p_id,
    deposit || 0,
    penalty || 0,
    price,
    duration_type,
    pickup_time || null,
    return_time || null,
  ]);
  return result.rows[0];
}

export async function getRentPlansByProductId(p_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    return getStore().rent_plans.filter(r => r.p_id === p_id);
  }

  const pool = getPool();
  const result = await pool.query(SELECT_RENT_PLANS_BY_PRODUCT_ID_QUERY, [p_id]);
  return result.rows;
}

export async function updateRentPlan(r_id, planData) {
  const { deposit, penalty, price, duration_type, pickup_time, return_time } = planData;
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const plan = store.rent_plans.find(r => r.r_id === r_id);
    if (!plan) return null;

    if (deposit !== undefined) plan.deposit = Number(deposit);
    if (penalty !== undefined) plan.penalty = Number(penalty);
    if (price !== undefined) plan.price = Number(price);
    if (duration_type !== undefined) plan.duration_type = duration_type;
    if (pickup_time !== undefined) plan.pickup_time = pickup_time;
    if (return_time !== undefined) plan.return_time = return_time;

    await saveStore();
    return plan;
  }

  const pool = getPool();
  const result = await pool.query(UPDATE_RENT_PLAN_QUERY, [
    deposit,
    penalty,
    price,
    duration_type,
    pickup_time,
    return_time,
    r_id,
  ]);
  return result.rows[0] || null;
}

export async function deleteRentPlan(r_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const idx = store.rent_plans.findIndex(r => r.r_id === r_id);
    if (idx === -1) return null;

    const [deleted] = store.rent_plans.splice(idx, 1);
    await saveStore();
    return deleted;
  }

  const pool = getPool();
  const result = await pool.query(DELETE_RENT_PLAN_QUERY, [r_id]);
  return result.rows[0] || null;
}
