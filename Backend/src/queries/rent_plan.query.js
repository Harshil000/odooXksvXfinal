// ==========================================
// RENT PLANS QUERIES
// ==========================================

export const INSERT_RENT_PLAN_QUERY = `
INSERT INTO rent_plans (p_id, deposit, penalty, price, duration_type, pickup_time, return_time)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING r_id, p_id, deposit, penalty, price, duration_type, pickup_time, return_time;
`;

export const SELECT_RENT_PLANS_BY_PRODUCT_ID_QUERY = `
SELECT r_id, p_id, deposit, penalty, price, duration_type, pickup_time, return_time
FROM rent_plans
WHERE p_id = $1;
`;

export const UPDATE_RENT_PLAN_QUERY = `
UPDATE rent_plans
SET deposit = $1, penalty = $2, price = $3, duration_type = $4, pickup_time = $5, return_time = $6
WHERE r_id = $7
RETURNING r_id, p_id, deposit, penalty, price, duration_type, pickup_time, return_time;
`;

export const DELETE_RENT_PLAN_QUERY = `
DELETE FROM rent_plans
WHERE r_id = $1
RETURNING r_id;
`;
