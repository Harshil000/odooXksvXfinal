// ==========================================
// CRON QUERIES FOR RENTING STATUS CHECKS
// ==========================================

export const SELECT_ACTIVE_RENTING_ORDERS_FOR_CRON_QUERY = `
SELECT 
  ro.rent_id,
  ro.email AS customer_email,
  ro.start_date,
  ro.end_date,
  ro.delivery_status,
  p.pname AS product_name,
  rp.penalty,
  rp.duration_type
FROM renting_orders ro
JOIN rent_plans rp ON ro.r_id = rp.r_id
JOIN products p ON rp.p_id = p.p_id
WHERE ro.delivery_status NOT IN ('returned', 'cancelled')
ORDER BY ro.end_date ASC;
`;
