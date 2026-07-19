// ==========================================
// PRODUCTS QUERIES
// ==========================================

export const INSERT_PRODUCT_QUERY = `
INSERT INTO products (c_id, pname, description, to_publish, quantity, product_type, sales_price, cost_price)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING p_id, c_id, pname, description, to_publish, quantity, product_type, sales_price, cost_price;
`;

export const SELECT_ALL_PRODUCTS_QUERY = `
SELECT p.p_id, p.c_id, p.pname, p.description, p.to_publish, p.quantity, p.product_type, p.sales_price, p.cost_price,
       (SELECT image_base64 FROM product_images i WHERE i.p_id = p.p_id LIMIT 1) as image,
       (SELECT COUNT(*)::int FROM assets a WHERE a.p_id = p.p_id) as asset_count,
       (SELECT COUNT(*)::int
          FROM assets a
          JOIN renting_orders ro ON ro.asset_id = a.asset_id
         WHERE a.p_id = p.p_id
           AND ro.delivery_status NOT IN ('returned', 'cancelled')
       ) as rented_count
FROM products p;
`;

export const SELECT_PRODUCT_BY_ID_QUERY = `
SELECT p_id, c_id, pname, description, to_publish, quantity, product_type, sales_price, cost_price
FROM products
WHERE p_id = $1;
`;

export const UPDATE_PRODUCT_QUERY = `
UPDATE products
SET pname = $1, description = $2, to_publish = $3, quantity = $4, product_type = $5, sales_price = $6, cost_price = $7
WHERE p_id = $8
RETURNING p_id, c_id, pname, description, to_publish, quantity, product_type, sales_price, cost_price;
`;

export const DELETE_PRODUCT_QUERY = `
DELETE FROM products
WHERE p_id = $1
RETURNING p_id;
`;

// ==========================================
// PRODUCT IMAGES QUERIES
// ==========================================

export const INSERT_PRODUCT_IMAGE_QUERY = `
INSERT INTO product_images (p_id, image_base64)
VALUES ($1, $2)
RETURNING img_id, p_id, image_base64;
`;

export const SELECT_IMAGES_BY_PRODUCT_ID_QUERY = `
SELECT img_id, p_id, image_base64
FROM product_images
WHERE p_id = $1;
`;

export const DELETE_PRODUCT_IMAGE_QUERY = `
DELETE FROM product_images
WHERE img_id = $1
RETURNING img_id;
`;

// ==========================================
// ASSETS QUERIES
// ==========================================

export const INSERT_ASSET_QUERY = `
INSERT INTO assets (p_id, qr)
VALUES ($1, $2)
RETURNING asset_id, p_id, qr;
`;

export const SELECT_ASSETS_BY_PRODUCT_ID_QUERY = `
SELECT
  a.asset_id,
  a.p_id,
  a.qr,
  ro.rent_id,
  ro.email AS customer_email,
  ro.u_id AS customer_id,
  u.first_name AS customer_first_name,
  u.last_name AS customer_last_name,
  ro.start_date,
  ro.end_date,
  ro.delivery_status,
  ro.invoice_status,
  ro.total
FROM assets a
LEFT JOIN LATERAL (
  SELECT *
  FROM renting_orders ro
  WHERE ro.asset_id = a.asset_id
    AND ro.delivery_status NOT IN ('returned', 'cancelled')
  ORDER BY ro.created_at DESC
  LIMIT 1
) ro ON true
LEFT JOIN users u ON u.u_id = ro.u_id OR LOWER(u.email) = LOWER(ro.email)
WHERE a.p_id = $1
ORDER BY a.asset_id;
`;
