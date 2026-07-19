import connectDB, { getPool } from "./src/config/database.js";
import argon2 from "argon2";
import dotenv from "dotenv";
import { indexProduct } from "./src/service/search.service.js";

dotenv.config();

// Standard 1x1 transparent GIF base64 string as a placeholder
const PLACEHOLDER_BASE64_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

async function seed() {
  console.log("[Seeder] Connecting to the database...");
  await connectDB();
  const pool = getPool();

  try {
    console.log("[Seeder] Cleaning existing database tables...");
    await pool.query("DELETE FROM refunds");
    await pool.query("DELETE FROM payments");
    await pool.query("DELETE FROM quotations");
    await pool.query("DELETE FROM cart_items");
    await pool.query("DELETE FROM delivery_route_stops");
    await pool.query("DELETE FROM delivery_routes");
    await pool.query("DELETE FROM renting_orders");
    await pool.query("DELETE FROM assets");
    await pool.query("DELETE FROM rent_plans");
    await pool.query("DELETE FROM product_images");
    await pool.query("DELETE FROM product_attributes");
    await pool.query("DELETE FROM products");
    await pool.query("DELETE FROM coupons");
    await pool.query("DELETE FROM vendors");
    await pool.query("DELETE FROM company");
    await pool.query("DELETE FROM addresses");
    await pool.query("DELETE FROM users");
    await pool.query("DELETE FROM attribute_values");
    await pool.query("DELETE FROM attribute_keys");
    await pool.query("DELETE FROM attributes");

    console.log("[Seeder] Hashing passwords with Argon2...");
    const hashedPassword = await argon2.hash("password123");

    console.log("[Seeder] Inserting Users...");
    const userRes = await pool.query(`
      INSERT INTO users (first_name, last_name, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING u_id, email
    `, ["John", "Doe", "customer@example.com", hashedPassword]);
    const customer = userRes.rows[0];
    console.log(`Inserted user: ${customer.email} (${customer.u_id})`);

    console.log("[Seeder] Inserting Addresses...");
    // Ahmedabad coordinates: ~23.0645, 72.5639
    const addressRes = await pool.query(`
      INSERT INTO addresses (pincode, state, city, address_line1, address_line2, u_id, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING address_id, city
    `, ["380013", "Gujarat", "Ahmedabad", "Nava Vadaj", "Opposite Bus Station", customer.u_id, 23.0645, 72.5639]);
    const address = addressRes.rows[0];
    console.log(`Inserted address for user: ${address.city} (${address.address_id})`);

    console.log("[Seeder] Inserting Company...");
    // Store coordinates: ~23.0225, 72.5714
    const companyRes = await pool.query(`
      INSERT INTO company (product_category, gst_no, cname, pincode, city, state, address_line1, address_line2, store_address, store_latitude, store_longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING c_id, cname
    `, ["Electronics & Gadgets", "24AAAAA1111A1Z1", "TechRent Ahmedabad", "380013", "Ahmedabad", "Gujarat", "C/7 jigar appartment", "Drive In Road", "C/7 jigar appartment, Drive In Road, Ahmedabad, Gujarat 380013", 23.0225, 72.5714]);
    const company = companyRes.rows[0];
    console.log(`Inserted company: ${company.cname} (${company.c_id})`);

    console.log("[Seeder] Inserting Vendors...");
    const vendorRes = await pool.query(`
      INSERT INTO vendors (first_name, last_name, email, password, c_id, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING v_id, email, role
    `, ["Admin", "User", "admin@example.com", hashedPassword, company.c_id, "admin"]);
    const vendor = vendorRes.rows[0];
    console.log(`Inserted vendor: ${vendor.email} (${vendor.v_id})`);

    console.log("[Seeder] Inserting Products...");
    const p1Res = await pool.query(`
      INSERT INTO products (c_id, pname, description, product_type, sales_price, cost_price, to_publish, quantity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [company.c_id, "MacBook Pro M2", "Apple MacBook Pro M2 with 8-Core CPU and 10-Core GPU, 16GB RAM, 512GB SSD", "Electronics", 120000, 100000, true, 5]);
    const p1 = p1Res.rows[0];

    const p2Res = await pool.query(`
      INSERT INTO products (c_id, pname, description, product_type, sales_price, cost_price, to_publish, quantity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [company.c_id, "Sony WH-1000XM4 Headphones", "Sony Wireless Noise Cancelling Over-Ear Headphones with Mic for Phone Calls", "Accessories", 25000, 20000, true, 10]);
    const p2 = p2Res.rows[0];

    const p3Res = await pool.query(`
      INSERT INTO products (c_id, pname, description, product_type, sales_price, cost_price, to_publish, quantity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [company.c_id, "Canon EOS R6 Camera", "Canon EOS R6 Mirrorless Digital Camera Body Only with Dual Pixel CMOS AF II", "Cameras", 180000, 150000, true, 3]);
    const p3 = p3Res.rows[0];
    console.log(`Inserted 3 products.`);

    console.log("[Seeder] Inserting Product Images...");
    await pool.query(`
      INSERT INTO product_images (p_id, image_base64)
      VALUES ($1, $2), ($3, $4), ($5, $6)
    `, [p1.p_id, PLACEHOLDER_BASE64_IMAGE, p2.p_id, PLACEHOLDER_BASE64_IMAGE, p3.p_id, PLACEHOLDER_BASE64_IMAGE]);

    console.log("[Seeder] Inserting Rent Plans...");
    const rp1Res = await pool.query(`
      INSERT INTO rent_plans (p_id, deposit, pickup_time, return_time, penalty, price, duration_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING r_id
    `, [p1.p_id, 10000, "09:00:00", "18:00:00", 1000, 3000, "monthly"]);
    const rp1 = rp1Res.rows[0];

    const rp2Res = await pool.query(`
      INSERT INTO rent_plans (p_id, deposit, pickup_time, return_time, penalty, price, duration_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING r_id
    `, [p2.p_id, 2000, "09:00:00", "18:00:00", 200, 300, "daily"]);
    const rp2 = rp2Res.rows[0];

    const rp3Res = await pool.query(`
      INSERT INTO rent_plans (p_id, deposit, pickup_time, return_time, penalty, price, duration_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING r_id
    `, [p3.p_id, 15000, "09:00:00", "18:00:00", 1500, 2000, "weekly"]);
    const rp3 = rp3Res.rows[0];
    console.log(`Inserted 3 rent plans.`);

    console.log("[Seeder] Inserting Assets (Barcodes/Stock instances)...");
    const assets = [];
    // 5 assets for MacBook Pro M2
    for (let i = 1; i <= 5; i++) {
      const asset = await pool.query(`
        INSERT INTO assets (p_id, qr)
        VALUES ($1, $2)
        RETURNING asset_id
      `, [p1.p_id, `MAC-PRO-M2-00${i}`]);
      assets.push({ p_id: p1.p_id, id: asset.rows[0].asset_id });
    }
    // 10 assets for Sony Headphones
    for (let i = 1; i <= 10; i++) {
      const asset = await pool.query(`
        INSERT INTO assets (p_id, qr)
        VALUES ($1, $2)
        RETURNING asset_id
      `, [p2.p_id, `SONY-WH4-00${i}`]);
      assets.push({ p_id: p2.p_id, id: asset.rows[0].asset_id });
    }
    // 3 assets for Canon EOS R6 Camera
    for (let i = 1; i <= 3; i++) {
      const asset = await pool.query(`
        INSERT INTO assets (p_id, qr)
        VALUES ($1, $2)
        RETURNING asset_id
      `, [p3.p_id, `CANON-R6-00${i}`]);
      assets.push({ p_id: p3.p_id, id: asset.rows[0].asset_id });
    }
    console.log(`Inserted ${assets.length} product assets.`);

    console.log("[Seeder] Inserting Renting Orders & Payments...");
    // Order 1: Active Reserved Order (MacBook Pro)
    const o1Res = await pool.query(`
      INSERT INTO renting_orders (r_id, asset_id, u_id, invoice_address_id, delivery_address_id, email, start_date, end_date, delivery_status, invoice_status, payment_status, deposit_amount, total)
      VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '1 day', NOW() + INTERVAL '31 days', 'reserved', 'nothing_to_invoice', 'paid', 10000, 3000)
      RETURNING rent_id
    `, [rp1.r_id, assets.find(a => a.p_id === p1.p_id).id, customer.u_id, address.address_id, address.address_id, customer.email]);
    const o1 = o1Res.rows[0];

    await pool.query(`
      INSERT INTO payments (rent_id, u_id, razorpay_order_id, razorpay_payment_id, amount, is_deposit, status)
      VALUES ($1, $2, $3, $4, $5, true, 'captured')
    `, [o1.rent_id, customer.u_id, "order_demo_1", "pay_demo_1", 10000]);

    // Order 2: Active Picked Up Order (Sony Headphones)
    const o2Res = await pool.query(`
      INSERT INTO renting_orders (r_id, asset_id, u_id, invoice_address_id, delivery_address_id, email, start_date, end_date, delivery_status, invoice_status, payment_status, deposit_amount, total)
      VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', 'picked_up', 'nothing_to_invoice', 'paid', 2000, 1500)
      RETURNING rent_id
    `, [rp2.r_id, assets.find(a => a.p_id === p2.p_id).id, customer.u_id, address.address_id, address.address_id, customer.email]);
    const o2 = o2Res.rows[0];

    await pool.query(`
      INSERT INTO payments (rent_id, u_id, razorpay_order_id, razorpay_payment_id, amount, is_deposit, status)
      VALUES ($1, $2, $3, $4, $5, true, 'captured')
    `, [o2.rent_id, customer.u_id, "order_demo_2", "pay_demo_2", 2000]);

    // Order 3: Past Returned Order (Canon Camera)
    const o3Res = await pool.query(`
      INSERT INTO renting_orders (r_id, asset_id, u_id, invoice_address_id, delivery_address_id, email, start_date, end_date, delivery_status, invoice_status, payment_status, deposit_amount, total)
      VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days', 'returned', 'nothing_to_invoice', 'paid', 15000, 2000)
      RETURNING rent_id
    `, [rp3.r_id, assets.find(a => a.p_id === p3.p_id).id, customer.u_id, address.address_id, address.address_id, customer.email]);
    console.log(`Inserted 3 renting orders.`);

    console.log("[Seeder] Inserting Attributes, Keys, and Values...");
    const attr1Res = await pool.query(`
      INSERT INTO attributes (c_id, name)
      VALUES ($1, $2)
      RETURNING attri_id
    `, [company.c_id, "Color"]);
    const colorAttr = attr1Res.rows[0];

    const attr2Res = await pool.query(`
      INSERT INTO attributes (c_id, name)
      VALUES ($1, $2)
      RETURNING attri_id
    `, [company.c_id, "Brand"]);
    const brandAttr = attr2Res.rows[0];

    const key1Res = await pool.query(`
      INSERT INTO attribute_keys (attri_id, key_name)
      VALUES ($1, $2)
      RETURNING key_id
    `, [colorAttr.attri_id, "Choice"]);
    const colorKey = key1Res.rows[0];

    const key2Res = await pool.query(`
      INSERT INTO attribute_keys (attri_id, key_name)
      VALUES ($1, $2)
      RETURNING key_id
    `, [brandAttr.attri_id, "Maker"]);
    const brandKey = key2Res.rows[0];

    await pool.query(`
      INSERT INTO attribute_values (key_id, value_name)
      VALUES ($1, 'Space Gray'), ($1, 'Silver'), ($1, 'Black'),
             ($2, 'Apple'), ($2, 'Sony'), ($2, 'Canon')
    `, [colorKey.key_id, brandKey.key_id]);

    await pool.query(`
      INSERT INTO product_attributes (p_id, attri_id)
      VALUES ($1, $4), ($1, $5),
             ($2, $4), ($2, $5),
             ($3, $4), ($3, $5)
    `, [p1.p_id, p2.p_id, p3.p_id, colorAttr.attri_id, brandAttr.attri_id]);
    console.log(`Inserted attributes configuration.`);

    console.log("[Seeder] Inserting Quotations...");
    await pool.query(`
      INSERT INTO quotations (c_id, p_id, r_id, u_id, customer_name, customer_email, quantity, start_date, end_date, total, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [company.c_id, p1.p_id, rp1.r_id, customer.u_id, "Aditya Gandhi", "aditya@example.com", 1, new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), 3000, "sent"]);
    console.log(`Inserted quotations.`);

    console.log("[Seeder] Asynchronously indexing products in Qdrant (self-healing)...");
    await indexProduct(p1, [{ name: "Color", values: "Space Gray" }, { name: "Brand", values: "Apple" }]);
    await indexProduct(p2, [{ name: "Color", values: "Black" }, { name: "Brand", values: "Sony" }]);
    await indexProduct(p3, [{ name: "Color", values: "Black" }, { name: "Brand", values: "Canon" }]);
    console.log("[Seeder] Indexed all products in vector store.");

    console.log("[Seeder] SUCCESS! Database seeded successfully.");
  } catch (error) {
    console.error("[Seeder] FAILED to seed database:", error.message);
  } finally {
    await pool.end();
  }
}

seed();
