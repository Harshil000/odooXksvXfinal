// ==========================================
// ATTRIBUTES QUERIES
// ==========================================

export const INSERT_ATTRIBUTE_QUERY = `
INSERT INTO attributes (c_id, name)
VALUES ($1, $2)
RETURNING attri_id, c_id, name;
`;

export const SELECT_ATTRIBUTES_BY_COMPANY_ID_QUERY = `
SELECT attri_id, c_id, name
FROM attributes
WHERE c_id = $1;
`;

export const UPDATE_ATTRIBUTE_QUERY = `
UPDATE attributes
SET name = $1
WHERE attri_id = $2
RETURNING attri_id, c_id, name;
`;

export const DELETE_ATTRIBUTE_QUERY = `
DELETE FROM attributes
WHERE attri_id = $1
RETURNING attri_id;
`;

export const INSERT_PRODUCT_ATTRIBUTE_QUERY = `
INSERT INTO product_attributes (p_id, attri_id)
VALUES ($1, $2)
RETURNING p_id, attri_id;
`;

// ==========================================
// ATTRIBUTE KEYS QUERIES
// ==========================================

export const INSERT_ATTRIBUTE_KEY_QUERY = `
INSERT INTO attribute_keys (attri_id, key_name)
VALUES ($1, $2)
RETURNING key_id, attri_id, key_name;
`;

export const SELECT_ATTRIBUTE_KEYS_BY_ATTRI_ID_QUERY = `
SELECT key_id, attri_id, key_name
FROM attribute_keys
WHERE attri_id = $1;
`;

export const UPDATE_ATTRIBUTE_KEY_QUERY = `
UPDATE attribute_keys
SET key_name = $1
WHERE key_id = $2
RETURNING key_id, attri_id, key_name;
`;

export const DELETE_ATTRIBUTE_KEY_QUERY = `
DELETE FROM attribute_keys
WHERE key_id = $1
RETURNING key_id;
`;

// ==========================================
// ATTRIBUTE VALUES QUERIES
// ==========================================

export const INSERT_ATTRIBUTE_VALUE_QUERY = `
INSERT INTO attribute_values (key_id, value_name)
VALUES ($1, $2)
RETURNING value_id, key_id, value_name;
`;

export const SELECT_ATTRIBUTE_VALUES_BY_KEY_ID_QUERY = `
SELECT value_id, key_id, value_name
FROM attribute_values
WHERE key_id = $1;
`;

export const UPDATE_ATTRIBUTE_VALUE_QUERY = `
UPDATE attribute_values
SET value_name = $1
WHERE value_id = $2
RETURNING value_id, key_id, value_name;
`;

export const DELETE_ATTRIBUTE_VALUE_QUERY = `
DELETE FROM attribute_values
WHERE value_id = $1
RETURNING value_id;
`;
