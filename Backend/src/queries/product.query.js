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
       (SELECT image_base64 FROM product_images i WHERE i.p_id = p.p_id LIMIT 1) as image
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
