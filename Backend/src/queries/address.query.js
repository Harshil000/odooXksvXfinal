export const INSERT_ADDRESS_QUERY = `
WITH s AS (
  SELECT address_id, pincode, state, city, address_line1, address_line2, u_id
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
  RETURNING address_id, pincode, state, city, address_line1, address_line2, u_id
)
SELECT address_id, pincode, state, city, address_line1, address_line2, u_id FROM i
UNION ALL
SELECT address_id, pincode, state, city, address_line1, address_line2, u_id FROM s;
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
