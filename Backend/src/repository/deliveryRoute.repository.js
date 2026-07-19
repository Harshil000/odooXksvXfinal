import { getPool } from "../config/database.js";
import {
  SELECT_STORE_LOCATION_QUERY,
  UPDATE_STORE_COORDINATES_QUERY,
  UPDATE_ADDRESS_COORDINATES_QUERY,
  SELECT_DAILY_ORDERS_QUERY,
  INSERT_ROUTE_QUERY,
  INSERT_STOP_QUERY,
  SELECT_ROUTE_BY_DATE_QUERY,
  SELECT_ROUTE_STOPS_QUERY,
  UPDATE_STOP_STATUS_QUERY,
  DELETE_STOPS_FOR_ROUTE_QUERY,
  UPDATE_ROUTE_TOTALS_QUERY,
} from "../queries/deliveryRoute.query.js";
import { updateRentingOrderStatus } from "./order.repository.js";

export async function getStoreLocation() {
  const pool = getPool();
  const result = await pool.query(SELECT_STORE_LOCATION_QUERY);
  return result.rows[0] || null;
}

export async function updateStoreCoordinates(c_id, lat, lng) {
  const pool = getPool();
  await pool.query(UPDATE_STORE_COORDINATES_QUERY, [lat, lng, c_id]);
}

export async function updateAddressCoordinates(address_id, lat, lng) {
  const pool = getPool();
  await pool.query(UPDATE_ADDRESS_COORDINATES_QUERY, [lat, lng, address_id]);
}

export async function getDailyOrdersForRouting(dateStr) {
  const pool = getPool();
  const result = await pool.query(SELECT_DAILY_ORDERS_QUERY, [dateStr]);
  return result.rows;
}

export async function getRouteByDate(dateStr) {
  const pool = getPool();
  const result = await pool.query(SELECT_ROUTE_BY_DATE_QUERY, [dateStr]);
  return result.rows[0] || null;
}

export async function getRouteStops(route_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_ROUTE_STOPS_QUERY, [route_id]);
  return result.rows;
}

export async function createDeliveryRoute(driver_id, route_date, status, distance, duration) {
  const pool = getPool();
  const result = await pool.query(INSERT_ROUTE_QUERY, [
    driver_id,
    route_date,
    status || "pending",
    distance || 0,
    duration || 0,
  ]);
  return result.rows[0];
}

export async function createRouteStop(route_id, order_id, sequence, type, status, estTime) {
  const pool = getPool();
  const result = await pool.query(INSERT_STOP_QUERY, [
    route_id,
    order_id,
    sequence,
    type,
    status || "pending",
    estTime || null,
  ]);
  return result.rows[0];
}

export async function deleteStopsForRoute(route_id) {
  const pool = getPool();
  await pool.query(DELETE_STOPS_FOR_ROUTE_QUERY, [route_id]);
}

export async function updateRouteTotals(route_id, distance, duration) {
  const pool = getPool();
  await pool.query(UPDATE_ROUTE_TOTALS_QUERY, [distance, duration, route_id]);
}

export async function updateStopStatus(stop_id, status, actualTime) {
  const pool = getPool();
  
  // 1. Fetch stop details to retrieve rent_id and stop_type
  const stopResult = await pool.query(
    "SELECT rent_id, stop_type FROM delivery_route_stops WHERE stop_id = $1",
    [stop_id]
  );
  const stop = stopResult.rows[0];
 
  if (!stop) return null;
 
  // 2. Update stop status in delivery_route_stops
  const result = await pool.query(UPDATE_STOP_STATUS_QUERY, [
    status,
    actualTime || new Date(),
    stop_id,
  ]);
 
  // 3. Update customer order status in renting_orders
  let orderStatus = "pending";
  if (status === "completed") {
    orderStatus = stop.stop_type === "delivery" ? "delivered" : "returned";
  } else if (status === "failed") {
    orderStatus = stop.stop_type === "delivery" ? "failed_delivery" : "late_pickup";
  }
 
  await updateRentingOrderStatus(stop.rent_id, orderStatus);
 
  return result.rows[0] || null;
}
