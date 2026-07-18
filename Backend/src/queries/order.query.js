// ==========================================
// RENTING ORDERS QUERIES
// ==========================================

export const INSERT_RENTING_ORDER_QUERY = `
INSERT INTO renting_orders (
  r_id,
  asset_id,
  email,
  start_date,
  end_date,
  delivery_status,
  total,
  invoice_status,
  u_id,
  invoice_address_id,
  delivery_address_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status, u_id, invoice_address_id, delivery_address_id, created_at;
`;

export const SELECT_ALL_RENTING_ORDERS_QUERY = `
SELECT rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status, u_id, invoice_address_id, delivery_address_id, created_at
FROM renting_orders;
`;

export const SELECT_RENTING_ORDER_BY_ID_QUERY = `
SELECT rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status, u_id, invoice_address_id, delivery_address_id, created_at
FROM renting_orders
WHERE rent_id = $1;
`;

export const UPDATE_RENTING_ORDER_STATUS_QUERY = `
UPDATE renting_orders
SET delivery_status = $1
WHERE rent_id = $2
RETURNING rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status, u_id, invoice_address_id, delivery_address_id, created_at;
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
  ro.u_id AS order_user_id,
  COALESCE(ro.u_id, u.u_id) AS customer_id,
  COALESCE(u.first_name, '') AS customer_first_name,
  COALESCE(u.last_name, '') AS customer_last_name,
  ro.email AS customer_email,
  ro.invoice_address_id,
  ro.delivery_address_id,
  ia.pincode AS invoice_pincode,
  ia.state AS invoice_state,
  ia.city AS invoice_city,
  ia.address_line1 AS invoice_address_line1,
  ia.address_line2 AS invoice_address_line2,
  da.pincode AS delivery_pincode,
  da.state AS delivery_state,
  da.city AS delivery_city,
  da.address_line1 AS delivery_address_line1,
  da.address_line2 AS delivery_address_line2,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'address_id', a.address_id,
        'pincode', a.pincode,
        'state', a.state,
        'city', a.city,
        'address_line1', a.address_line1,
        'address_line2', a.address_line2
      )
    ) FILTER (WHERE a.address_id IS NOT NULL),
    '[]'
  ) AS customer_addresses,
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
LEFT JOIN users u ON u.u_id = ro.u_id OR LOWER(u.email) = LOWER(ro.email)
LEFT JOIN addresses a ON a.u_id = u.u_id
LEFT JOIN addresses ia ON ia.address_id = ro.invoice_address_id
LEFT JOIN addresses da ON da.address_id = ro.delivery_address_id
WHERE p.c_id = $1
GROUP BY
  ro.rent_id,
  ro.r_id,
  ro.asset_id,
  ro.u_id,
  u.u_id,
  u.first_name,
  u.last_name,
  ro.email,
  ro.invoice_address_id,
  ro.delivery_address_id,
  ia.pincode,
  ia.state,
  ia.city,
  ia.address_line1,
  ia.address_line2,
  da.pincode,
  da.state,
  da.city,
  da.address_line1,
  da.address_line2,
  ro.start_date,
  ro.end_date,
  ro.delivery_status,
  ro.invoice_status,
  ro.total,
  ro.created_at,
  rp.deposit,
  rp.penalty,
  rp.price,
  rp.duration_type,
  rp.pickup_time,
  rp.return_time,
  p.pname,
  p.p_id
ORDER BY ro.created_at DESC;
`;
