import { createRentPlan, getRentPlansByProduct, deleteRentPlan } from "../api/rentPlan.api";

export async function loadProductRentPlans(productId) {
  const data = await getRentPlansByProduct(productId);
  return data.plans || [];
}

export async function saveRentPlans(productId, rentPlans) {
  // First clear existing plans if any
  try {
    const existing = await loadProductRentPlans(productId);
    for (const plan of existing) {
      if (plan.r_id) {
        await deleteRentPlan(plan.r_id);
      }
    }
  } catch (err) {
    console.error("Error clearing old rent plans:", err);
  }

  const plansToSave = rentPlans.filter((plan) => plan.price);

  for (const plan of plansToSave) {
    await createRentPlan(productId, {
      deposit: Number(plan.security_deposit || plan.deposit || 0),
      penalty: Number(plan.late_fees || plan.penalty || 0),
      price: Number(plan.price || 0),
      duration_type: plan.periodicity || plan.duration_type,
      pickup_time: plan.pickup || plan.pickup_time || null,
      return_time: plan.return || plan.return_time || null,
    });
  }
}

