export const INSERT_USER_QUERY = `
INSERT INTO users (full_name, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, full_name, email, is_active, created_at, updated_at;
`;

// export const INSERT_VENDOR_QUERY = `
// INSERT INTO vendors (user_id, company_name, gst_number, contact_person, phone, address)
// VALUES ($1, $2, $3, $4, $5, $6)
// RETURNING id, user_id, company_name, gst_number, contact_person, phone, address, rating, status, created_at;
// `;

export const SELECT_USER_BY_EMAIL_QUERY = `
SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active, u.created_at, u.updated_at
FROM users u
WHERE u.email = $1
LIMIT 1;
`;

export const SELECT_USER_BY_ID_QUERY = `
SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active, u.created_at, u.updated_at
FROM users u
WHERE u.id = $1
LIMIT 1;
`;