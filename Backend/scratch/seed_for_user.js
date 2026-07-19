import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

function uuid() { return crypto.randomUUID(); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randElement(arr) { return arr[rand(0, arr.length - 1)]; }

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const runId = rand(1000, 9999);
    const c_id = 'aa1dc8a4-ebac-4384-aa9f-82f570f85fb8'; // User's actual company
    const u_id = '2a3c2242-995f-464f-ab00-588383a54d5d'; // Will replace with real u_id from DB

    // 1. Fetch some real users to use as customers
    const resUsers = await pool.query('SELECT u_id, email FROM users LIMIT 10');
    if (resUsers.rows.length === 0) throw new Error("No users found in database to act as customers.");
    const realUsers = resUsers.rows;

    // 2. Fetch an address for those users
    const resAddrs = await pool.query('SELECT address_id, u_id FROM addresses');
    const realAddrs = resAddrs.rows;

    // 3. Insert Products
    const products = [];
    const rent_plans = [];
    const assets = [];
    let assetSeq = 1;

    for (let i = 0; i < 15; i++) {
      const p_id = uuid();
      products.push({
        p_id, c_id, pname: `Premium Item ${i} (${runId})`, description: 'Great condition.',
        product_type: 'Goods', sales_price: rand(500, 5000), cost_price: rand(100, 1000), to_publish: true, quantity: 5
      });
      const r_id = uuid();
      rent_plans.push({
        r_id, p_id, deposit: rand(50, 200), penalty: 10, price: rand(20, 100), duration_type: randElement(['daily', 'weekly', 'monthly'])
      });
      for (let j = 0; j < 5; j++) {
        assets.push({ asset_id: uuid(), p_id, qr: `QR-${runId}-MYCOMP-${assetSeq++}` });
      }
    }

    await pool.query('BEGIN');

    for (const p of products) {
      await pool.query('INSERT INTO products (p_id, c_id, pname, description, product_type, sales_price, cost_price, to_publish, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [p.p_id, p.c_id, p.pname, p.description, p.product_type, p.sales_price, p.cost_price, p.to_publish, p.quantity]);
    }
    for (const r of rent_plans) {
      await pool.query('INSERT INTO rent_plans (r_id, p_id, deposit, penalty, price, duration_type) VALUES ($1, $2, $3, $4, $5, $6)',
        [r.r_id, r.p_id, r.deposit, r.penalty, r.price, r.duration_type]);
    }
    for (const a of assets) {
      await pool.query('INSERT INTO assets (asset_id, p_id, qr) VALUES ($1, $2, $3)', [a.asset_id, a.p_id, a.qr]);
    }

    // 4. Quotations
    for (let i = 0; i < 10; i++) {
      const p = randElement(products);
      const rp = rent_plans.find(r => r.p_id === p.p_id);
      const cust = randElement(realUsers);
      await pool.query(
        'INSERT INTO quotations (c_id, p_id, r_id, u_id, customer_name, customer_email, quantity, start_date, end_date, total, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [c_id, p.p_id, rp.r_id, cust.u_id, 'Test Cust', cust.email, rand(1,3), '2026-08-01 10:00:00', '2026-08-05 10:00:00', rp.price * 4, randElement(['sent', 'confirmed', 'rejected'])]
      );
    }

    // 5. Renting Orders & Payments
    for (let i = 0; i < 30; i++) {
      const p = randElement(products);
      const rp = rent_plans.find(r => r.p_id === p.p_id);
      const as = randElement(assets.filter(a => a.p_id === p.p_id));
      const cust = randElement(realUsers);
      const addr = realAddrs.find(a => a.u_id === cust.u_id) || { address_id: null };

      const resOrder = await pool.query(
        'INSERT INTO renting_orders (r_id, asset_id, u_id, invoice_address_id, delivery_address_id, email, start_date, end_date, delivery_status, invoice_status, payment_status, deposit_amount, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING rent_id',
        [rp.r_id, as.asset_id, cust.u_id, addr.address_id, addr.address_id, cust.email, '2026-08-01 10:00:00', '2026-08-05 10:00:00', randElement(['pending', 'delivered']), 'nothing_to_invoice', 'paid', rp.deposit, rp.price * 4]
      );
      const rent_id = resOrder.rows[0].rent_id;

      await pool.query(
        'INSERT INTO payments (rent_id, u_id, razorpay_order_id, razorpay_payment_id, amount, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [rent_id, cust.u_id, `order_${uuid()}`, `pay_${uuid()}`, rp.price * 4, 'captured']
      );
    }

    await pool.query('COMMIT');
    console.log("Successfully seeded data for your specific company!");
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
run();
