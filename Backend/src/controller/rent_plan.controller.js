import {
  createRentPlan,
  getRentPlansByProductId,
  updateRentPlan,
  deleteRentPlan,
} from "../repository/rent_plan.repository.js";

// ==========================================
// RENT PLANS
// ==========================================

export async function createRentPlanController(req, res, next) {
  try {
    const { p_id } = req.params;
    const { deposit, penalty, price, duration_type, pickup_time, return_time } = req.body;

    if (!p_id) return res.status(400).json({ message: "Product ID is required" });
    if (price === undefined) return res.status(400).json({ message: "Price is required" });
    if (!duration_type) return res.status(400).json({ message: "Duration type is required" });

    const validDurations = ["hourly", "daily", "nightly", "weekly", "monthly", "yearly"];
    if (!validDurations.includes(duration_type)) {
      return res.status(400).json({ message: "Invalid duration type" });
    }

    const planData = { deposit, penalty, price, duration_type, pickup_time, return_time };
    const plan = await createRentPlan(p_id, planData);

    return res.status(201).json({ message: "Rent plan created successfully", plan });
  } catch (error) {
    next(error);
  }
}

export async function getRentPlansController(req, res, next) {
  try {
    const { p_id } = req.params;
    if (!p_id) return res.status(400).json({ message: "Product ID is required" });

    const plans = await getRentPlansByProductId(p_id);
    return res.status(200).json({ plans });
  } catch (error) {
    next(error);
  }
}

export async function updateRentPlanController(req, res, next) {
  try {
    const { r_id } = req.params;
    const { deposit, penalty, price, duration_type, pickup_time, return_time } = req.body;

    if (!r_id) return res.status(400).json({ message: "Rent Plan ID is required" });

    if (duration_type) {
      const validDurations = ["hourly", "daily", "nightly", "weekly", "monthly", "yearly"];
      if (!validDurations.includes(duration_type)) {
        return res.status(400).json({ message: "Invalid duration type" });
      }
    }

    const planData = { deposit, penalty, price, duration_type, pickup_time, return_time };
    const plan = await updateRentPlan(r_id, planData);

    if (!plan) return res.status(404).json({ message: "Rent plan not found" });

    return res.status(200).json({ message: "Rent plan updated successfully", plan });
  } catch (error) {
    next(error);
  }
}

export async function deleteRentPlanController(req, res, next) {
  try {
    const { r_id } = req.params;
    if (!r_id) return res.status(400).json({ message: "Rent Plan ID is required" });

    const deleted = await deleteRentPlan(r_id);
    if (!deleted) return res.status(404).json({ message: "Rent plan not found" });

    return res.status(200).json({ message: "Rent plan deleted successfully" });
  } catch (error) {
    next(error);
  }
}
