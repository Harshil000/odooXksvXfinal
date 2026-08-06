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
    
    // Get ALL companies
    const resComps = await pool.query('SELECT c_id, cname FROM company');
    if (resComps.rows.length === 0) throw new Error("No companies found.");
    const companies = resComps.rows;

    const resUsers = await pool.query('SELECT u_id, email FROM users LIMIT 10');
    if (resUsers.rows.length === 0) throw new Error("No users found.");
    const realUsers = resUsers.rows;

    const resAddrs = await pool.query('SELECT address_id, u_id FROM addresses');
    const realAddrs = resAddrs.rows;

    const products = [];
    const rent_plans = [];
    const assets = [];
    let assetSeq = 1;

    for (const comp of companies) {
      const c_id = comp.c_id;

      // Create 5 products for each company
      for (let i = 0; i < 5; i++) {
        const p_id = uuid();
        products.push({
          p_id, c_id, pname: `Premium Item ${i} (${runId})`, description: 'Great condition.',
          product_type: 'Goods', sales_price: rand(100, 1000), cost_price: rand(50, 500), to_publish: true, quantity: 5
        });

        const r_id = uuid();
        rent_plans.push({
          r_id, p_id, deposit: rand(10, 100), penalty: rand(5, 20), price: rand(10, 50), duration_type: randElement(['daily', 'weekly'])
        });

        for (let j = 0; j < 3; j++) {
          assets.push({ asset_id: uuid(), p_id, qr: `QR-${runId}-${assetSeq++}` });
        }
      }
    }

    const renting_orders = [];
    const quotations = [];
    const payments = [];

    // Create 10 orders and 5 quotations per company
    let orderCounter = 1;
    let quoteCounter = 1;

    for (const comp of companies) {
      const compProducts = products.filter(p => p.c_id === comp.c_id);
      if (compProducts.length === 0) continue;

      for (let i = 0; i < 100; i++) {
        const user = randElement(realUsers);
        const addr = realAddrs.find(a => a.u_id === user.u_id) || { address_id: null };
        const prod = randElement(compProducts);
        const plan = rent_plans.find(rp => rp.p_id === prod.p_id);
        const prodAssets = assets.filter(a => a.p_id === prod.p_id);
        const asset = randElement(prodAssets);

        const rent_id = (runId * 100000) + orderCounter++;
        
        renting_orders.push({
          rent_id, r_id: plan.r_id, asset_id: asset.asset_id, u_id: user.u_id,
          invoice_address_id: addr.address_id, delivery_address_id: addr.address_id, email: user.email,
          start_date: '2026-08-01 10:00:00', end_date: '2026-08-05 10:00:00',
          delivery_status: randElement(['pending', 'delivered']), invoice_status: 'nothing_to_invoice',
          payment_status: 'paid', deposit_amount: plan.deposit, deposit_refunded_amount: 0, total: plan.price * 4
        });

        payments.push({
          payment_id: uuid(), rent_id, u_id: user.u_id,
          razorpay_order_id: `order_${runId}_${orderCounter}`, razorpay_payment_id: `pay_${runId}_${orderCounter}`,
          amount: plan.price * 4, is_deposit: false, status: 'captured', method: 'upi'
        });
      }

      for (let i = 0; i < 100; i++) {
        const prod = randElement(compProducts);
        const plan = rent_plans.find(rp => rp.p_id === prod.p_id);
        const q_id = (runId * 100000) + quoteCounter++;

        quotations.push({
          q_id, c_id: comp.c_id, p_id: prod.p_id, r_id: plan.r_id, u_id: randElement(realUsers).u_id,
          customer_name: `Customer ${i}`, customer_email: `customer${i}_${runId}@example.com`, quantity: 1,
          start_date: '2026-09-01 10:00:00', end_date: '2026-09-05 10:00:00', total: plan.price * 4, status: randElement(['sent', 'confirmed'])
        });
      }
    }

    // Insert everything
    for (const p of products) {
      await pool.query('INSERT INTO products (p_id, c_id, pname, description, product_type, sales_price, cost_price, to_publish, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [p.p_id, p.c_id, p.pname, p.description, p.product_type, p.sales_price, p.cost_price, p.to_publish, p.quantity]);
    }
    for (const r of rent_plans) {
      await pool.query('INSERT INTO rent_plans (r_id, p_id, deposit, penalty, price, duration_type) VALUES ($1, $2, $3, $4, $5, $6)', [r.r_id, r.p_id, r.deposit, r.penalty, r.price, r.duration_type]);
    }
    for (const a of assets) {
      await pool.query('INSERT INTO assets (asset_id, p_id, qr) VALUES ($1, $2, $3)', [a.asset_id, a.p_id, a.qr]);
    }
    for (const o of renting_orders) {
      await pool.query('INSERT INTO renting_orders (rent_id, r_id, asset_id, u_id, invoice_address_id, delivery_address_id, email, start_date, end_date, delivery_status, invoice_status, payment_status, deposit_amount, deposit_refunded_amount, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)', [o.rent_id, o.r_id, o.asset_id, o.u_id, o.invoice_address_id, o.delivery_address_id, o.email, o.start_date, o.end_date, o.delivery_status, o.invoice_status, o.payment_status, o.deposit_amount, o.deposit_refunded_amount, o.total]);
    }
    for (const p of payments) {
      await pool.query('INSERT INTO payments (payment_id, rent_id, u_id, razorpay_order_id, razorpay_payment_id, amount, is_deposit, status, method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [p.payment_id, p.rent_id, p.u_id, p.razorpay_order_id, p.razorpay_payment_id, p.amount, p.is_deposit, p.status, p.method]);
    }
    for (const q of quotations) {
      await pool.query('INSERT INTO quotations (q_id, c_id, p_id, r_id, u_id, customer_name, customer_email, quantity, start_date, end_date, total, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)', [q.q_id, q.c_id, q.p_id, q.r_id, q.u_id, q.customer_name, q.customer_email, q.quantity, q.start_date, q.end_date, q.total, q.status]);
    }

    console.log("Successfully seeded data for ALL companies!");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
