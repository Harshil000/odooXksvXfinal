import fs from 'fs';
import crypto from 'crypto';

function uuid() { return crypto.randomUUID(); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randElement(arr) { return arr[rand(0, arr.length - 1)]; }

const runId = rand(10000, 99999);
const offset = runId * 100;

const users = Array.from({ length: 20 }).map((_, i) => ({
  u_id: uuid(),
  first_name: `User${i}`,
  last_name: `Lastname${i}`,
  email: `user${i}_${runId}@example.com`,
  password: 'hashedpassword123'
}));

const companies = Array.from({ length: 5 }).map((_, i) => ({
  c_id: uuid(),
  product_category: randElement(['Electronics', 'Furniture', 'Vehicles', 'Tools']),
  gst_no: `GST${rand(100000, 999999)}${runId}`,
  cname: `Rental Company ${i} - ${runId}`,
  pincode: `10000${i}`,
  city: 'Metropolis',
  state: 'State',
  address_line1: `${i} Main St`,
  store_address: `${i} Main St, Metropolis`,
  store_latitude: rand(10, 50) + Math.random(),
  store_longitude: rand(70, 90) + Math.random()
}));

const addresses = users.map(u => ({
  address_id: uuid(),
  pincode: `10000${rand(0,9)}`,
  state: 'State',
  city: 'Metropolis',
  address_line1: `Apt ${rand(1, 100)}`,
  u_id: u.u_id,
  latitude: rand(10, 50) + Math.random(),
  longitude: rand(70, 90) + Math.random()
}));

const products = [];
const rent_plans = [];
const assets = [];
let assetSequence = 1;

companies.forEach(c => {
  for (let i = 0; i < 10; i++) {
    const p_id = uuid();
    products.push({
      p_id, c_id: c.c_id, pname: `${c.product_category} Item ${i} (${runId})`,
      description: `Great ${c.product_category} item for rent.`, product_type: 'Goods',
      sales_price: rand(100, 1000), cost_price: rand(50, 500), to_publish: true, quantity: 5
    });

    const r_id = uuid();
    rent_plans.push({
      r_id, p_id, deposit: rand(10, 100), penalty: rand(5, 20), price: rand(10, 50), duration_type: randElement(['daily', 'weekly'])
    });

    for (let j = 0; j < 5; j++) {
      assets.push({ asset_id: uuid(), p_id, qr: `QR-${runId}-${c.cname.substring(0,3).toUpperCase()}-${assetSequence++}` });
    }
  }
});

const renting_orders = [];
for (let i = 0; i < 100; i++) {
  const user = randElement(users);
  const addr = addresses.find(a => a.u_id === user.u_id);
  const plan = randElement(rent_plans);
  const productAssets = assets.filter(a => a.p_id === plan.p_id);
  const asset = randElement(productAssets);

  renting_orders.push({
    rent_id: offset + i + 1, r_id: plan.r_id, asset_id: asset.asset_id, u_id: user.u_id,
    invoice_address_id: addr.address_id, delivery_address_id: addr.address_id, email: user.email,
    start_date: `2026-08-01 10:00:00`, end_date: `2026-08-05 10:00:00`,
    delivery_status: randElement(['pending', 'delivered']), invoice_status: 'nothing_to_invoice',
    payment_status: 'paid', deposit_amount: plan.deposit, deposit_refunded_amount: 0, total: plan.price * 4
  });
}

const payments = [];
const delivery_routes = [];
const delivery_route_stops = [];
const quotations = [];

renting_orders.forEach(o => {
  payments.push({
    payment_id: uuid(), rent_id: o.rent_id, u_id: o.u_id,
    razorpay_order_id: `order_${rand(100000, 999999)}${runId}`,
    razorpay_payment_id: `pay_${rand(100000, 999999)}${runId}`,
    amount: o.total, is_deposit: false, status: 'captured', method: 'upi'
  });
});

const drivers = users.slice(0, 3);
for (let i = 0; i < 5; i++) {
  const driver = randElement(drivers);
  const route_id = offset + i + 1;
  delivery_routes.push({
    route_id, driver_id: driver.u_id, route_date: '2026-08-01', status: 'completed',
    total_distance_km: rand(10, 100), total_duration_minutes: rand(30, 240)
  });

  const routeOrders = renting_orders.slice(i * 3, (i * 3) + 3);
  routeOrders.forEach((order, index) => {
    delivery_route_stops.push({
      stop_id: offset + (i * 3) + index + 1, route_id, rent_id: order.rent_id,
      stop_sequence: index + 1, stop_type: 'delivery', status: 'completed',
      estimated_arrival_time: `2026-08-01 ${10 + index}:00:00`, actual_arrival_time: `2026-08-01 ${10 + index}:15:00`
    });
  });
}

for (let i = 0; i < 10; i++) {
  const comp = randElement(companies);
  const compProducts = products.filter(p => p.c_id === comp.c_id);
  const product = randElement(compProducts);
  const compPlans = rent_plans.filter(rp => rp.p_id === product.p_id);
  const plan = randElement(compPlans);
  
  quotations.push({
    q_id: offset + i + 1, c_id: comp.c_id, p_id: product.p_id, r_id: plan.r_id, u_id: randElement(users).u_id,
    customer_name: `Customer ${i}`, customer_email: `customer${i}_${runId}@example.com`, quantity: rand(1, 5),
    start_date: '2026-09-01 10:00:00', end_date: '2026-09-05 10:00:00', total: plan.price * 4, status: randElement(['sent', 'confirmed', 'rejected'])
  });
}

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'number') return str;
  return `'${String(str).replace(/'/g, "''")}'`;
}

let sql = '';
sql += 'BEGIN;\n\n';

users.forEach(u => sql += `INSERT INTO users (u_id, first_name, last_name, email, password) VALUES (${esc(u.u_id)}, ${esc(u.first_name)}, ${esc(u.last_name)}, ${esc(u.email)}, ${esc(u.password)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

addresses.forEach(a => sql += `INSERT INTO addresses (address_id, pincode, state, city, address_line1, u_id, latitude, longitude) VALUES (${esc(a.address_id)}, ${esc(a.pincode)}, ${esc(a.state)}, ${esc(a.city)}, ${esc(a.address_line1)}, ${esc(a.u_id)}, ${esc(a.latitude)}, ${esc(a.longitude)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

companies.forEach(c => sql += `INSERT INTO company (c_id, product_category, gst_no, cname, pincode, city, state, address_line1, store_address, store_latitude, store_longitude) VALUES (${esc(c.c_id)}, ${esc(c.product_category)}, ${esc(c.gst_no)}, ${esc(c.cname)}, ${esc(c.pincode)}, ${esc(c.city)}, ${esc(c.state)}, ${esc(c.address_line1)}, ${esc(c.store_address)}, ${esc(c.store_latitude)}, ${esc(c.store_longitude)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

products.forEach(p => sql += `INSERT INTO products (p_id, c_id, pname, description, product_type, sales_price, cost_price, to_publish, quantity) VALUES (${esc(p.p_id)}, ${esc(p.c_id)}, ${esc(p.pname)}, ${esc(p.description)}, ${esc(p.product_type)}, ${esc(p.sales_price)}, ${esc(p.cost_price)}, ${esc(p.to_publish)}, ${esc(p.quantity)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

rent_plans.forEach(r => sql += `INSERT INTO rent_plans (r_id, p_id, deposit, penalty, price, duration_type) VALUES (${esc(r.r_id)}, ${esc(r.p_id)}, ${esc(r.deposit)}, ${esc(r.penalty)}, ${esc(r.price)}, ${esc(r.duration_type)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

assets.forEach(a => sql += `INSERT INTO assets (asset_id, p_id, qr) VALUES (${esc(a.asset_id)}, ${esc(a.p_id)}, ${esc(a.qr)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

renting_orders.forEach(o => sql += `INSERT INTO renting_orders (rent_id, r_id, asset_id, u_id, invoice_address_id, delivery_address_id, email, start_date, end_date, delivery_status, invoice_status, payment_status, deposit_amount, deposit_refunded_amount, total) VALUES (${esc(o.rent_id)}, ${esc(o.r_id)}, ${esc(o.asset_id)}, ${esc(o.u_id)}, ${esc(o.invoice_address_id)}, ${esc(o.delivery_address_id)}, ${esc(o.email)}, ${esc(o.start_date)}, ${esc(o.end_date)}, ${esc(o.delivery_status)}, ${esc(o.invoice_status)}, ${esc(o.payment_status)}, ${esc(o.deposit_amount)}, ${esc(o.deposit_refunded_amount)}, ${esc(o.total)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

payments.forEach(p => sql += `INSERT INTO payments (payment_id, rent_id, u_id, razorpay_order_id, razorpay_payment_id, amount, is_deposit, status, method) VALUES (${esc(p.payment_id)}, ${esc(p.rent_id)}, ${esc(p.u_id)}, ${esc(p.razorpay_order_id)}, ${esc(p.razorpay_payment_id)}, ${esc(p.amount)}, ${esc(p.is_deposit)}, ${esc(p.status)}, ${esc(p.method)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

delivery_routes.forEach(dr => sql += `INSERT INTO delivery_routes (route_id, driver_id, route_date, status, total_distance_km, total_duration_minutes) VALUES (${esc(dr.route_id)}, ${esc(dr.driver_id)}, ${esc(dr.route_date)}, ${esc(dr.status)}, ${esc(dr.total_distance_km)}, ${esc(dr.total_duration_minutes)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

delivery_route_stops.forEach(drs => sql += `INSERT INTO delivery_route_stops (stop_id, route_id, rent_id, stop_sequence, stop_type, status, estimated_arrival_time, actual_arrival_time) VALUES (${esc(drs.stop_id)}, ${esc(drs.route_id)}, ${esc(drs.rent_id)}, ${esc(drs.stop_sequence)}, ${esc(drs.stop_type)}, ${esc(drs.status)}, ${esc(drs.estimated_arrival_time)}, ${esc(drs.actual_arrival_time)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

quotations.forEach(q => sql += `INSERT INTO quotations (q_id, c_id, p_id, r_id, u_id, customer_name, customer_email, quantity, start_date, end_date, total, status) VALUES (${esc(q.q_id)}, ${esc(q.c_id)}, ${esc(q.p_id)}, ${esc(q.r_id)}, ${esc(q.u_id)}, ${esc(q.customer_name)}, ${esc(q.customer_email)}, ${esc(q.quantity)}, ${esc(q.start_date)}, ${esc(q.end_date)}, ${esc(q.total)}, ${esc(q.status)}) ON CONFLICT DO NOTHING;\n`);
sql += '\n';

sql += `SELECT setval('renting_orders_rent_id_seq', (SELECT MAX(rent_id) FROM renting_orders));\n`;
sql += `SELECT setval('delivery_routes_route_id_seq', (SELECT MAX(route_id) FROM delivery_routes));\n`;
sql += `SELECT setval('delivery_route_stops_stop_id_seq', (SELECT MAX(stop_id) FROM delivery_route_stops));\n`;
sql += `SELECT setval('quotations_q_id_seq', (SELECT MAX(q_id) FROM quotations));\n`;

sql += 'COMMIT;\n';

fs.writeFileSync('seed_data.sql', sql);
console.log('Robust seed_data.sql generated successfully.');
