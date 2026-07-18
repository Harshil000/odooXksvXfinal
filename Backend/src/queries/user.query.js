export const INSERT_USER_QUERY = `
INSERT INTO users (first_name, last_name, profile_image, email, password)
VALUES ($1, $2, $3, $4, $5)
RETURNING u_id, first_name, last_name, profile_image, email;
`;

export const UPDATE_USER_PROFILE_QUERY = `
UPDATE users 
SET first_name = $1, last_name = $2, profile_image = $3
WHERE u_id = $4
RETURNING u_id, first_name, last_name, profile_image, email;
`;

export const UPDATE_VENDOR_PROFILE_QUERY = `
UPDATE vendors 
SET first_name = $1, last_name = $2, profile_image = $3
WHERE v_id = $4
RETURNING v_id, first_name, last_name, profile_image, email, c_id, role;
`;

export const SELECT_USER_BY_EMAIL_QUERY = `
SELECT u_id, first_name, last_name, profile_image, email, password
FROM users
WHERE LOWER(email) = LOWER($1)
LIMIT 1;
`;

export const SELECT_USER_BY_ID_QUERY = `
SELECT u_id, first_name, last_name, profile_image, email, password
FROM users
WHERE u_id = $1
LIMIT 1;
`;

export const INSERT_COMPANY_QUERY = `
INSERT INTO company (product_category, comp_prof_image, gst_no, cname, pincode, city, state, address_line1, address_line2)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING c_id, product_category, comp_prof_image, gst_no, cname, pincode, city, state, address_line1, address_line2;
`;

export const SELECT_COMPANY_BY_ID_QUERY = `
SELECT c_id, product_category, comp_prof_image, gst_no, cname, pincode, city, state, address_line1, address_line2
FROM company
WHERE c_id = $1
LIMIT 1;
`;

export const INSERT_VENDOR_QUERY = `
INSERT INTO vendors (first_name, last_name, profile_image, email, password, c_id, role)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING v_id, first_name, last_name, profile_image, email, c_id, role;
`;

export const SELECT_VENDOR_BY_EMAIL_QUERY = `
SELECT v_id, first_name, last_name, profile_image, email, password, c_id, role
FROM vendors
WHERE LOWER(email) = LOWER($1)
LIMIT 1;
`;

export const SELECT_VENDOR_BY_ID_QUERY = `
SELECT v_id, first_name, last_name, profile_image, email, password, c_id, role
FROM vendors
WHERE v_id = $1
LIMIT 1;
`;

export const UPDATE_COMPANY_PROFILE_QUERY = `
UPDATE company
SET cname = $1, product_category = $2, gst_no = $3, pincode = $4, city = $5, state = $6, address_line1 = $7, address_line2 = $8, comp_prof_image = $9
WHERE c_id = $10
RETURNING c_id, product_category, comp_prof_image, gst_no, cname, pincode, city, state, address_line1, address_line2;
`;