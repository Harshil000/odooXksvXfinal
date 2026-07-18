-- =========================================================
-- RENTAL MANAGEMENT DATABASE
-- PostgreSQL clean schema
-- Matches current Backend/src/queries/*.query.js
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE vendor_role_enum AS ENUM ('admin', 'vendor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE rent_duration_type_enum AS ENUM (
    'hourly',
    'daily',
    'nightly',
    'weekly',
    'monthly',
    'yearly'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
  u_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_image TEXT,
  email VARCHAR(255) NOT NULL,
  password TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON users (LOWER(email));

-- =========================================================
-- ADDRESSES
-- =========================================================

CREATE TABLE IF NOT EXISTS addresses (
  address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode VARCHAR(20) NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  u_id UUID NOT NULL,
  CONSTRAINT addresses_u_id_fk
    FOREIGN KEY (u_id)
    REFERENCES users(u_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS addresses_u_id_idx ON addresses (u_id);
CREATE INDEX IF NOT EXISTS addresses_pincode_idx ON addresses (pincode);

-- =========================================================
-- COMPANY
-- =========================================================

CREATE TABLE IF NOT EXISTS company (
  c_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_category VARCHAR(150) NOT NULL,
  comp_prof_image TEXT,
  gst_no VARCHAR(50) NOT NULL,
  cname VARCHAR(150) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS company_gst_no_unique_idx ON company (gst_no);
CREATE INDEX IF NOT EXISTS company_name_idx ON company (cname);
CREATE INDEX IF NOT EXISTS company_product_category_idx ON company (product_category);

-- =========================================================
-- VENDORS
-- =========================================================

CREATE TABLE IF NOT EXISTS vendors (
  v_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_image TEXT,
  email VARCHAR(255) NOT NULL,
  password TEXT NOT NULL,
  c_id UUID NOT NULL,
  role vendor_role_enum NOT NULL,
  CONSTRAINT vendors_c_id_fk
    FOREIGN KEY (c_id)
    REFERENCES company(c_id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS vendors_email_unique_idx
  ON vendors (LOWER(email));
CREATE INDEX IF NOT EXISTS vendors_c_id_idx ON vendors (c_id);
CREATE INDEX IF NOT EXISTS vendors_role_idx ON vendors (role);

-- =========================================================
-- COUPONS
-- =========================================================

CREATE TABLE IF NOT EXISTS coupons (
  coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  c_id UUID NOT NULL,
  code VARCHAR(100) NOT NULL,
  percent NUMERIC(5,2) NOT NULL,
  coupon_limit INTEGER NOT NULL,
  start_price NUMERIC(12,2) NOT NULL,
  CONSTRAINT coupons_percent_check CHECK (percent >= 0 AND percent <= 100),
  CONSTRAINT coupons_limit_check CHECK (coupon_limit >= 0),
  CONSTRAINT coupons_start_price_check CHECK (start_price >= 0),
  CONSTRAINT coupons_c_id_fk
    FOREIGN KEY (c_id)
    REFERENCES company(c_id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS coupons_company_code_unique_idx
  ON coupons (c_id, code);
CREATE INDEX IF NOT EXISTS coupons_c_id_idx ON coupons (c_id);
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);

-- =========================================================
-- PRODUCTS
-- =========================================================

CREATE TABLE IF NOT EXISTS products (
  p_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  c_id UUID NOT NULL,
  pname VARCHAR(200) NOT NULL,
  description TEXT,
  product_type VARCHAR(50) DEFAULT 'Goods',
  sales_price NUMERIC(12,2) DEFAULT 0,
  cost_price NUMERIC(12,2) DEFAULT 0,
  to_publish BOOLEAN NOT NULL DEFAULT FALSE,
  quantity INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT products_quantity_check CHECK (quantity >= 0),
  CONSTRAINT products_c_id_fk
    FOREIGN KEY (c_id)
    REFERENCES company(c_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS products_c_id_idx ON products (c_id);
CREATE INDEX IF NOT EXISTS products_name_idx ON products (pname);
CREATE INDEX IF NOT EXISTS products_publish_idx ON products (to_publish);

-- =========================================================
-- PRODUCT IMAGES
-- =========================================================

CREATE TABLE IF NOT EXISTS product_images (
  img_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  p_id UUID NOT NULL,
  image_base64 TEXT NOT NULL,
  CONSTRAINT product_images_p_id_fk
    FOREIGN KEY (p_id)
    REFERENCES products(p_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS product_images_p_id_idx ON product_images (p_id);

-- =========================================================
-- RENT PLANS
-- =========================================================

CREATE TABLE IF NOT EXISTS rent_plans (
  r_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  p_id UUID NOT NULL,
  deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
  pickup_time TIME,
  return_time TIME,
  penalty NUMERIC(12,2) NOT NULL DEFAULT 0,
  price NUMERIC(12,2) NOT NULL,
  duration_type rent_duration_type_enum NOT NULL,
  CONSTRAINT rent_plans_deposit_check CHECK (deposit >= 0),
  CONSTRAINT rent_plans_penalty_check CHECK (penalty >= 0),
  CONSTRAINT rent_plans_price_check CHECK (price >= 0),
  CONSTRAINT rent_plans_p_id_fk
    FOREIGN KEY (p_id)
    REFERENCES products(p_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS rent_plans_p_id_idx ON rent_plans (p_id);
CREATE INDEX IF NOT EXISTS rent_plans_duration_type_idx ON rent_plans (duration_type);

-- =========================================================
-- ASSETS
-- =========================================================

CREATE TABLE IF NOT EXISTS assets (
  asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  p_id UUID NOT NULL,
  qr TEXT NOT NULL,
  CONSTRAINT assets_p_id_fk
    FOREIGN KEY (p_id)
    REFERENCES products(p_id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS assets_qr_unique_idx ON assets (qr);
CREATE INDEX IF NOT EXISTS assets_p_id_idx ON assets (p_id);

-- =========================================================
-- RENTING ORDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS renting_orders (
  rent_id BIGSERIAL PRIMARY KEY,
  r_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  u_id UUID,
  invoice_address_id UUID,
  delivery_address_id UUID,
  email VARCHAR(255) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  delivery_status VARCHAR(50) NOT NULL,
  invoice_status VARCHAR(50) NOT NULL DEFAULT 'nothing_to_invoice',
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT renting_orders_date_check CHECK (end_date > start_date),
  CONSTRAINT renting_orders_total_check CHECK (total >= 0),
  CONSTRAINT renting_orders_r_id_fk
    FOREIGN KEY (r_id)
    REFERENCES rent_plans(r_id)
    ON DELETE CASCADE,
  CONSTRAINT renting_orders_asset_id_fk
    FOREIGN KEY (asset_id)
    REFERENCES assets(asset_id)
    ON DELETE CASCADE,
  CONSTRAINT renting_orders_u_id_fk
    FOREIGN KEY (u_id)
    REFERENCES users(u_id)
    ON DELETE SET NULL,
  CONSTRAINT renting_orders_invoice_address_id_fk
    FOREIGN KEY (invoice_address_id)
    REFERENCES addresses(address_id)
    ON DELETE SET NULL,
  CONSTRAINT renting_orders_delivery_address_id_fk
    FOREIGN KEY (delivery_address_id)
    REFERENCES addresses(address_id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS renting_orders_r_id_idx ON renting_orders (r_id);
CREATE INDEX IF NOT EXISTS renting_orders_asset_id_idx ON renting_orders (asset_id);
CREATE INDEX IF NOT EXISTS renting_orders_u_id_idx ON renting_orders (u_id);
CREATE INDEX IF NOT EXISTS renting_orders_invoice_address_id_idx ON renting_orders (invoice_address_id);
CREATE INDEX IF NOT EXISTS renting_orders_delivery_address_id_idx ON renting_orders (delivery_address_id);
CREATE INDEX IF NOT EXISTS renting_orders_email_idx ON renting_orders (email);
CREATE INDEX IF NOT EXISTS renting_orders_delivery_status_idx ON renting_orders (delivery_status);
CREATE INDEX IF NOT EXISTS renting_orders_invoice_status_idx ON renting_orders (invoice_status);
CREATE INDEX IF NOT EXISTS renting_orders_start_date_idx ON renting_orders (start_date);
CREATE INDEX IF NOT EXISTS renting_orders_end_date_idx ON renting_orders (end_date);
CREATE INDEX IF NOT EXISTS renting_orders_schedule_idx
  ON renting_orders (asset_id, start_date, end_date);

-- =========================================================
-- ATTRIBUTES
-- Company-level attributes. Products link through product_attributes.
-- =========================================================

CREATE TABLE IF NOT EXISTS attributes (
  attri_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  c_id UUID NOT NULL,
  name VARCHAR(150) NOT NULL,
  CONSTRAINT attributes_c_id_fk
    FOREIGN KEY (c_id)
    REFERENCES company(c_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS attributes_c_id_idx ON attributes (c_id);
CREATE INDEX IF NOT EXISTS attributes_name_idx ON attributes (name);
CREATE UNIQUE INDEX IF NOT EXISTS attributes_company_name_unique_idx
  ON attributes (c_id, LOWER(name));

CREATE TABLE IF NOT EXISTS product_attributes (
  p_id UUID NOT NULL,
  attri_id UUID NOT NULL,
  PRIMARY KEY (p_id, attri_id),
  CONSTRAINT product_attributes_p_id_fk
    FOREIGN KEY (p_id)
    REFERENCES products(p_id)
    ON DELETE CASCADE,
  CONSTRAINT product_attributes_attri_id_fk
    FOREIGN KEY (attri_id)
    REFERENCES attributes(attri_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS product_attributes_attri_id_idx
  ON product_attributes (attri_id);

-- =========================================================
-- ATTRIBUTE KEYS
-- =========================================================

CREATE TABLE IF NOT EXISTS attribute_keys (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attri_id UUID NOT NULL,
  key_name VARCHAR(150) NOT NULL,
  CONSTRAINT attribute_keys_attri_id_fk
    FOREIGN KEY (attri_id)
    REFERENCES attributes(attri_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS attribute_keys_attri_id_idx ON attribute_keys (attri_id);
CREATE INDEX IF NOT EXISTS attribute_keys_name_idx ON attribute_keys (key_name);

-- =========================================================
-- ATTRIBUTE VALUES
-- =========================================================

CREATE TABLE IF NOT EXISTS attribute_values (
  value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL,
  value_name VARCHAR(150) NOT NULL,
  CONSTRAINT attribute_values_key_id_fk
    FOREIGN KEY (key_id)
    REFERENCES attribute_keys(key_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS attribute_values_key_id_idx ON attribute_values (key_id);
CREATE INDEX IF NOT EXISTS attribute_values_name_idx ON attribute_values (value_name);

-- =========================================================
-- QUOTATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS quotations (
  q_id BIGSERIAL PRIMARY KEY,
  c_id UUID NOT NULL,
  p_id UUID NOT NULL,
  r_id UUID NOT NULL,
  u_id UUID,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  total NUMERIC NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'sent',
  rent_id BIGINT,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT quotations_c_id_fk FOREIGN KEY (c_id) REFERENCES companies(c_id) ON DELETE CASCADE,
  CONSTRAINT quotations_p_id_fk FOREIGN KEY (p_id) REFERENCES products(p_id) ON DELETE CASCADE,
  CONSTRAINT quotations_r_id_fk FOREIGN KEY (r_id) REFERENCES rent_plans(r_id) ON DELETE CASCADE,
  CONSTRAINT quotations_u_id_fk FOREIGN KEY (u_id) REFERENCES users(u_id) ON DELETE SET NULL,
  CONSTRAINT quotations_rent_id_fk FOREIGN KEY (rent_id) REFERENCES renting_orders(rent_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS quotations_r_id_idx ON quotations (r_id);
CREATE INDEX IF NOT EXISTS quotations_c_id_idx ON quotations (c_id);
CREATE INDEX IF NOT EXISTS quotations_p_id_idx ON quotations (p_id);


-- =========================================================
-- CART ITEMS
-- =========================================================

CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  u_id UUID NOT NULL,
  p_id UUID NOT NULL,
  r_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT cart_items_u_id_fk
    FOREIGN KEY (u_id)
    REFERENCES users(u_id)
    ON DELETE CASCADE,
  CONSTRAINT cart_items_p_id_fk
    FOREIGN KEY (p_id)
    REFERENCES products(p_id)
    ON DELETE CASCADE,
  CONSTRAINT cart_items_r_id_fk
    FOREIGN KEY (r_id)
    REFERENCES rent_plans(r_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS cart_items_u_id_idx ON cart_items (u_id);
CREATE INDEX IF NOT EXISTS cart_items_p_id_idx ON cart_items (p_id);
CREATE INDEX IF NOT EXISTS cart_items_r_id_idx ON cart_items (r_id);
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_plan_unique_idx
  ON cart_items (u_id, p_id, r_id);
