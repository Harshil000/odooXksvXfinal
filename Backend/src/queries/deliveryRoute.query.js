// ==========================================
// DELIVERY ROUTE QUERIES
// ==========================================

export const SELECT_STORE_LOCATION_QUERY = `
SELECT c_id, address_line1, address_line2, city, state, pincode, store_latitude, store_longitude 
FROM company 
LIMIT 1;
`;

export const UPDATE_STORE_COORDINATES_QUERY = `
UPDATE company 
SET store_latitude = $1, store_longitude = $2 
WHERE c_id = $3;
`;

export const UPDATE_ADDRESS_COORDINATES_QUERY = `
UPDATE addresses 
SET latitude = $1, longitude = $2 
WHERE address_id = $3;
`;

export const SELECT_DAILY_ORDERS_QUERY = `
SELECT r.rent_id, r.start_date, r.end_date, r.delivery_status, 1 as quantity, r.total,
       p.pname as product_name,
       u.first_name, u.last_name, u.email,
       -- delivery address details
       da.address_id as delivery_address_id, da.address_line1 as d_address1, da.address_line2 as d_address2, da.city as d_city, da.state as d_state, da.pincode as d_pincode, da.latitude as d_lat, da.longitude as d_lng,
       -- invoice address details
       ia.address_id as invoice_address_id, ia.address_line1 as i_address1, ia.address_line2 as i_address2, ia.city as i_city, ia.state as i_state, ia.pincode as i_pincode, ia.latitude as i_lat, ia.longitude as i_lng
FROM renting_orders r
LEFT JOIN rent_plans rp ON r.r_id = rp.r_id
LEFT JOIN products p ON rp.p_id = p.p_id
LEFT JOIN users u ON r.u_id = u.u_id
LEFT JOIN addresses da ON r.delivery_address_id = da.address_id
LEFT JOIN addresses ia ON r.invoice_address_id = ia.address_id
WHERE DATE(r.start_date) = $1 OR DATE(r.end_date) = $1;
`;

export const INSERT_ROUTE_QUERY = `
INSERT INTO delivery_routes (driver_id, route_date, status, total_distance_km, total_duration_minutes)
VALUES ($1, $2, $3, $4, $5)
RETURNING route_id, driver_id, route_date, status, total_distance_km, total_duration_minutes;
`;

export const INSERT_STOP_QUERY = `
INSERT INTO delivery_route_stops (route_id, rent_id, stop_sequence, stop_type, status, estimated_arrival_time)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING stop_id, route_id, rent_id, stop_sequence, stop_type, status, estimated_arrival_time;
`;

export const SELECT_ROUTE_BY_DATE_QUERY = `
SELECT * FROM delivery_routes WHERE route_date = $1 LIMIT 1;
`;

export const SELECT_ROUTE_STOPS_QUERY = `
SELECT s.*, 
       r.start_date, r.end_date, r.delivery_status as order_delivery_status, 1 as quantity, r.total, r.delivery_address_id,
       p.pname as product_name,
       u.first_name, u.last_name, u.email,
       da.address_line1 as d_address1, da.address_line2 as d_address2, da.city as d_city, da.state as d_state, da.pincode as d_pincode, da.latitude as d_lat, da.longitude as d_lng
FROM delivery_route_stops s
LEFT JOIN renting_orders r ON s.rent_id = r.rent_id
LEFT JOIN rent_plans rp ON r.r_id = rp.r_id
LEFT JOIN products p ON rp.p_id = p.p_id
LEFT JOIN users u ON r.u_id = u.u_id
LEFT JOIN addresses da ON r.delivery_address_id = da.address_id
WHERE s.route_id = $1
ORDER BY s.stop_sequence ASC;
`;

export const UPDATE_STOP_STATUS_QUERY = `
UPDATE delivery_route_stops 
SET status = $1, actual_arrival_time = $2 
WHERE stop_id = $3
RETURNING *;
`;

export const DELETE_STOPS_FOR_ROUTE_QUERY = `
DELETE FROM delivery_route_stops WHERE route_id = $1;
`;

export const UPDATE_ROUTE_TOTALS_QUERY = `
UPDATE delivery_routes 
SET total_distance_km = $1, total_duration_minutes = $2 
WHERE route_id = $3;
`;
