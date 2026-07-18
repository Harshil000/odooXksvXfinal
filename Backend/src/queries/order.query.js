// ==========================================
// RENTING ORDERS QUERIES
// ==========================================

export const INSERT_RENTING_ORDER_QUERY = `
INSERT INTO renting_orders (r_id, asset_id, email, start_date, end_date, delivery_status, total)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total;
`;

export const SELECT_ALL_RENTING_ORDERS_QUERY = `
SELECT rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total
FROM renting_orders;
`;

export const SELECT_RENTING_ORDER_BY_ID_QUERY = `
SELECT rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total
FROM renting_orders
WHERE rent_id = $1;
`;

export const UPDATE_RENTING_ORDER_STATUS_QUERY = `
UPDATE renting_orders
SET delivery_status = $1
WHERE rent_id = $2
RETURNING rent_id, r_id, asset_id, email, start_date, end_date, delivery_status, total;
`;

export const DELETE_RENTING_ORDER_QUERY = `
DELETE FROM renting_orders
WHERE rent_id = $1
RETURNING rent_id;
`;
