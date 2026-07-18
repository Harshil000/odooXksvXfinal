// ==========================================
// RENTING ORDERS QUERIES
// ==========================================

export const INSERT_RENTING_ORDER_QUERY = `
INSERT INTO renting_orders (r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status, created_at;
`;

export const SELECT_ALL_RENTING_ORDERS_QUERY = `
SELECT rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status, created_at
FROM renting_orders;
`;

export const SELECT_RENTING_ORDER_BY_ID_QUERY = `
SELECT rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status, created_at
FROM renting_orders
WHERE rent_id = $1;
`;

export const UPDATE_RENTING_ORDER_STATUS_QUERY = `
UPDATE renting_orders
SET delivery_status = $1
WHERE rent_id = $2
RETURNING rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status, created_at;
`;

export const DELETE_RENTING_ORDER_QUERY = `
DELETE FROM renting_orders
WHERE rent_id = $1
RETURNING rent_id;
`;

// ==========================================
// ENRICHED DASHBOARD QUERY
// JOINs orders with rent_plans and products
// to provide all data needed for the dashboard
// ==========================================

export const SELECT_ENRICHED_ORDERS_BY_COMPANY_QUERY = `
SELECT
  ro.rent_id,
  ro.r_id,
  ro.asset_id,
  ro.email AS customer_email,
  ro.start_date,
  ro.end_date,
  ro.delivery_status,
  ro.invoice_status,
  ro.total,
  ro.created_at,
  rp.deposit,
  rp.penalty,
  rp.price AS plan_price,
  rp.duration_type,
  rp.pickup_time,
  rp.return_time,
  p.pname AS product_name,
  p.p_id
FROM renting_orders ro
JOIN rent_plans rp ON ro.r_id = rp.r_id
JOIN products p ON rp.p_id = p.p_id
WHERE p.c_id = $1
ORDER BY ro.created_at DESC;
`;
