export const INSERT_QUOTATION_QUERY = `
INSERT INTO quotations (
  c_id,
  p_id,
  r_id,
  u_id,
  customer_name,
  customer_email,
  quantity,
  start_date,
  end_date,
  total,
  status,
  sent_at,
  created_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
RETURNING *;
`;

export const SELECT_QUOTATIONS_BY_COMPANY_QUERY = `
SELECT 
  q.q_id,
  q.c_id,
  q.p_id,
  q.r_id,
  q.u_id,
  q.customer_name,
  q.customer_email,
  q.quantity,
  q.start_date,
  q.end_date,
  q.total,
  q.status,
  q.rent_id,
  q.sent_at,
  q.confirmed_at,
  q.created_at,
  p.pname AS product_name,
  rp.duration_type,
  rp.price AS plan_price
FROM quotations q
JOIN products p ON q.p_id = p.p_id
JOIN rent_plans rp ON q.r_id = rp.r_id
WHERE q.c_id = $1
ORDER BY q.created_at DESC;
`;

export const SELECT_QUOTATION_BY_ID_QUERY = `
SELECT 
  q.q_id,
  q.c_id,
  q.p_id,
  q.r_id,
  q.u_id,
  q.customer_name,
  q.customer_email,
  q.quantity,
  q.start_date,
  q.end_date,
  q.total,
  q.status,
  q.rent_id,
  q.sent_at,
  q.confirmed_at,
  q.created_at,
  p.pname AS product_name,
  rp.duration_type,
  rp.price AS plan_price
FROM quotations q
JOIN products p ON q.p_id = p.p_id
JOIN rent_plans rp ON q.r_id = rp.r_id
WHERE q.q_id = $1;
`;

export const SELECT_QUOTATION_GROUP_QUERY = `
SELECT 
  q.q_id,
  q.c_id,
  q.p_id,
  q.r_id,
  q.u_id,
  q.customer_name,
  q.customer_email,
  q.quantity,
  q.start_date,
  q.end_date,
  q.total,
  q.status,
  q.rent_id,
  q.sent_at,
  q.confirmed_at,
  q.created_at,
  p.pname AS product_name,
  rp.duration_type,
  rp.price AS plan_price
FROM quotations q
JOIN products p ON q.p_id = p.p_id
JOIN rent_plans rp ON q.r_id = rp.r_id
WHERE q.customer_email = $1 
  AND ABS(EXTRACT(EPOCH FROM (q.sent_at - $2))) < 2
ORDER BY q.created_at ASC;
`;

export const UPDATE_QUOTATION_STATUS_QUERY = `
UPDATE quotations
SET status = $1, confirmed_at = $2
WHERE q_id = $3
RETURNING *;
`;

export const UPDATE_QUOTATION_GROUP_CONFIRMED_QUERY = `
UPDATE quotations
SET status = 'confirmed', confirmed_at = NOW()
WHERE customer_email = $1 
  AND ABS(EXTRACT(EPOCH FROM (sent_at - $2))) < 2
RETURNING *;
`;

export const UPDATE_QUOTATION_CONVERTED_QUERY = `
UPDATE quotations
SET status = 'converted', rent_id = $1
WHERE q_id = $2
RETURNING *;
`;

export const SELECT_FREE_ASSET_QUERY = `
SELECT a.asset_id 
FROM assets a
WHERE a.p_id = $1
  AND a.asset_id NOT IN (
    SELECT ro.asset_id 
    FROM renting_orders ro
    WHERE ro.delivery_status NOT IN ('returned', 'cancelled')
      AND NOT (ro.end_date <= $2 OR ro.start_date >= $3)
  )
ORDER BY a.asset_id
LIMIT 1;
`;

export const SELECT_ANY_ASSET_QUERY = `
SELECT asset_id FROM assets WHERE p_id = $1 LIMIT 1;
`;

export const INSERT_FALLBACK_ASSET_QUERY = `
INSERT INTO assets (p_id, qr) 
VALUES ($1, $2) 
RETURNING asset_id;
`;

export const SELECT_QUOTATION_RAW_GROUP_QUERY = `
SELECT * FROM quotations 
WHERE customer_email = $1 
  AND ABS(EXTRACT(EPOCH FROM (sent_at - $2))) < 2;
`;

export const SELECT_USER_BY_EMAIL_QUERY = `
SELECT u_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;
`;

export const INSERT_GUEST_USER_QUERY = `
INSERT INTO users (first_name, last_name, email, password)
VALUES ($1, $2, $3, $4)
RETURNING u_id;
`;

export const INSERT_ADDRESS_QUERY = `
WITH s AS (
  SELECT address_id
  FROM addresses
  WHERE pincode = $1 
    AND state = $2 
    AND city = $3 
    AND address_line1 = $4 
    AND COALESCE(address_line2, '') = COALESCE($5, '') 
    AND (u_id = $6 OR (u_id IS NULL AND $6 IS NULL))
  LIMIT 1
), i AS (
  INSERT INTO addresses (pincode, state, city, address_line1, address_line2, u_id)
  SELECT $1, $2, $3, $4, $5, $6
  WHERE NOT EXISTS (SELECT 1 FROM s)
  RETURNING address_id
)
SELECT address_id FROM i
UNION ALL
SELECT address_id FROM s;
`;

export const SELECT_ADDRESS_BY_USER_QUERY = `
SELECT address_id FROM addresses WHERE u_id = $1 LIMIT 1;
`;

export const SELECT_RENT_PLAN_DEPOSIT_QUERY = `
SELECT deposit FROM rent_plans WHERE r_id = $1;
`;

export const INSERT_RENTING_ORDER_QUERY = `
INSERT INTO renting_orders (
  r_id,
  asset_id,
  u_id,
  invoice_address_id,
  delivery_address_id,
  email,
  start_date,
  end_date,
  delivery_status,
  invoice_status,
  total,
  payment_status,
  deposit_amount,
  deposit_refunded_amount
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0)
RETURNING *;
`;
