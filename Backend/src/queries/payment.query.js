export const INSERT_PAYMENT_QUERY = `
INSERT INTO payments (
  rent_id,
  u_id,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  amount,
  currency,
  is_deposit,
  status,
  method
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;
`;

export const UPDATE_ORDER_PAYMENT_STATUS_QUERY = `
UPDATE renting_orders
SET payment_status = $1
WHERE rent_id = $2
RETURNING *;
`;
