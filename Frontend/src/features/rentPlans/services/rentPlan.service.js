import { createRentPlan, getRentPlansByProduct } from "../api/rentPlan.api";

export async function loadProductRentPlans(productId) {
  const data = await getRentPlansByProduct(productId);
  return data.plans || [];
}

export async function saveRentPlans(productId, rentPlans) {
  const plansToSave = rentPlans.filter((plan) => plan.price);

  for (const plan of plansToSave) {
    await createRentPlan(productId, {
      deposit: Number(plan.security_deposit || 0),
      penalty: Number(plan.late_fees || 0),
      price: Number(plan.price || 0),
      duration_type: plan.periodicity,
      pickup_time: plan.pickup || null,
      return_time: plan.return || null,
    });
  }
}
