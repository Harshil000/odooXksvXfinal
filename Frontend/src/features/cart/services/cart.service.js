/**
 * Maps raw backend cart items to client-friendly shapes.
 */
export function mapCartItem(item) {
  const quantity = Number(item.quantity) || 1;
  const planPrice = Number(item.plan_price) || 0;
  const deposit = Number(item.deposit) || 0;
  
  // Calculate total rental cost for this item based on dates
  let rentDurationCount = 1;
  let totalPlanPrice = planPrice;

  if (item.start_date && item.end_date) {
    const start = new Date(item.start_date);
    const end = new Date(item.end_date);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
      const diffMs = end - start;
      switch (item.duration_type) {
        case "hourly":
          rentDurationCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
          break;
        case "daily":
        case "nightly":
          rentDurationCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          break;
        case "weekly":
          rentDurationCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)));
          break;
        case "monthly":
          rentDurationCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
          break;
        case "yearly":
          rentDurationCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 365)));
          break;
      }
    }
  }

  totalPlanPrice = planPrice * rentDurationCount;
  const subtotal = (totalPlanPrice + deposit) * quantity;

  return {
    id: item.cart_item_id,
    productId: item.p_id,
    planId: item.r_id,
    productName: item.product_name,
    planPrice,
    totalPlanPrice,
    deposit,
    durationType: item.duration_type,
    quantity,
    startDate: item.start_date,
    endDate: item.end_date,
    image: item.image,
    subtotal,
    rentDurationCount,
  };
}

/**
 * Computes checkout totals for the whole cart.
 */
export function calculateCartTotals(items = []) {
  let rentalTotal = 0;
  let depositTotal = 0;
  let totalItemsCount = 0;

  for (const item of items) {
    rentalTotal += item.totalPlanPrice * item.quantity;
    depositTotal += item.deposit * item.quantity;
    totalItemsCount += item.quantity;
  }

  return {
    rentalTotal,
    depositTotal,
    grandTotal: rentalTotal + depositTotal,
    totalItemsCount,
  };
}
