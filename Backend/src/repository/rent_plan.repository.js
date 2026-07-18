import { getPool } from "../config/database.js";
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
  const pool = getPool();
  const result = await pool.query(SELECT_RENT_PLANS_BY_PRODUCT_ID_QUERY, [p_id]);
  return result.rows;
}

export async function updateRentPlan(r_id, planData) {
  const { deposit, penalty, price, duration_type, pickup_time, return_time } = planData;

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
  const pool = getPool();
  const result = await pool.query(DELETE_RENT_PLAN_QUERY, [r_id]);
  return result.rows[0] || null;
}
