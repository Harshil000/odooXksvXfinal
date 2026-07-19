// ==========================================
// CART QUERIES
// ==========================================

export const INSERT_CART_ITEM_QUERY = `
INSERT INTO cart_items (u_id, p_id, r_id, quantity, start_date, end_date)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING cart_item_id, u_id, p_id, r_id, quantity, start_date, end_date, created_at;
`;

export const SELECT_CART_ITEMS_BY_USER_QUERY = `
SELECT
  c.cart_item_id,
  c.u_id,
  c.p_id,
  c.r_id,
  c.quantity,
  c.start_date,
  c.end_date,
  c.created_at,
  p.pname AS product_name,
  p.sales_price,
  p.cost_price,
  p.quantity AS product_quantity,
  rp.price AS plan_price,
  rp.duration_type,
  rp.deposit,
  (SELECT image_base64 FROM product_images pi WHERE pi.p_id = p.p_id LIMIT 1) AS image
FROM cart_items c
JOIN products p ON c.p_id = p.p_id
JOIN rent_plans rp ON c.r_id = rp.r_id
WHERE c.u_id = $1
ORDER BY c.created_at DESC;
`;

export const UPDATE_CART_ITEM_QUERY = `
UPDATE cart_items
SET quantity = $1, start_date = $2, end_date = $3
WHERE cart_item_id = $4
RETURNING cart_item_id, u_id, p_id, r_id, quantity, start_date, end_date, created_at;
`;

export const DELETE_CART_ITEM_QUERY = `
DELETE FROM cart_items
WHERE cart_item_id = $1
RETURNING cart_item_id;
`;

export const CLEAR_CART_QUERY = `
DELETE FROM cart_items
WHERE u_id = $1;
`;
