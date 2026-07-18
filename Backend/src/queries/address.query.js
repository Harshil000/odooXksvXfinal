export const INSERT_ADDRESS_QUERY = `
INSERT INTO addresses (pincode, state, city, address_line1, address_line2, u_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING address_id, pincode, state, city, address_line1, address_line2, u_id;
`;

export const SELECT_ADDRESSES_BY_USER_ID_QUERY = `
SELECT address_id, pincode, state, city, address_line1, address_line2, u_id
FROM addresses
WHERE u_id = $1;
`;

export const UPDATE_ADDRESS_QUERY = `
UPDATE addresses
SET pincode = $1, state = $2, city = $3, address_line1 = $4, address_line2 = $5
WHERE address_id = $6 AND u_id = $7
RETURNING address_id, pincode, state, city, address_line1, address_line2, u_id;
`;

export const DELETE_ADDRESS_QUERY = `
DELETE FROM addresses
WHERE address_id = $1 AND u_id = $2
RETURNING address_id;
`;
