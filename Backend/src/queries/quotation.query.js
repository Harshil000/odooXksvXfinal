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
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
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

export const UPDATE_QUOTATION_STATUS_QUERY = `
UPDATE quotations
SET status = $1, confirmed_at = $2
WHERE q_id = $3
RETURNING *;
`;

export const UPDATE_QUOTATION_CONVERTED_QUERY = `
UPDATE quotations
SET status = 'converted', rent_id = $1
WHERE q_id = $2
RETURNING *;
`;
