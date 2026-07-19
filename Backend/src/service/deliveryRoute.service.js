import {
  getStoreLocation,
  updateStoreCoordinates,
  updateAddressCoordinates,
  getDailyOrdersForRouting,
  getRouteByDate,
  getRouteStops,
  createDeliveryRoute,
  createRouteStop,
  deleteStopsForRoute,
  updateRouteTotals,
} from "../repository/deliveryRoute.repository.js";

// Helper: Haversine distance in km
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Geocode via OpenStreetMap Nominatim with a fallback
async function geocodeAddress(addressStr, fallbackLat, fallbackLng, city, state, pincode) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addressStr)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "RentalManagementSystem/1.0" },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (err) {
    console.error(`[Geocoder] Failed for: "${addressStr}". Message: ${err.message}`);
  }

  // Fallback 1: Try geocoding city, state, pincode if provided
  if (city || state || pincode) {
    try {
      const fallbackStr = `${city || ""}, ${state || ""} ${pincode || ""}`.trim().replace(/^,\s*|,\s*$/g, "");
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(fallbackStr)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "RentalManagementSystem/1.0" },
      });
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    } catch (err) {
      console.error(`[Geocoder] City fallback failed. Message: ${err.message}`);
    }
  }

  // Fallback 2: Default coordinates (Ahmedabad center 23.0225, 72.5714)
  const defaultLat = fallbackLat || 23.0225;
  const defaultLng = fallbackLng || 72.5714;
  return {
    latitude: defaultLat + (Math.random() - 0.5) * 0.01,
    longitude: defaultLng + (Math.random() - 0.5) * 0.01,
  };
}

export async function fetchStoreAndGeocode() {
  const store = await getStoreLocation();
  if (!store) return null;

  if (store.store_latitude && store.store_longitude) {
    return {
      c_id: store.c_id,
      name: store.cname,
      lat: parseFloat(store.store_latitude),
      lng: parseFloat(store.store_longitude),
      fullAddress: `${store.address_line1}, ${store.city}, ${store.state} ${store.pincode}`,
    };
  }

  const fullAddress = `${store.address_line1}, ${store.city}, ${store.state} ${store.pincode}`;
  // Default store location coordinate: Ahmedabad Center (23.0225, 72.5714)
  const coords = await geocodeAddress(fullAddress, 23.0225, 72.5714, store.city, store.state, store.pincode);

  await updateStoreCoordinates(store.c_id, coords.latitude, coords.longitude);

  return {
    c_id: store.c_id,
    name: store.cname,
    lat: coords.latitude,
    lng: coords.longitude,
    fullAddress,
  };
}

export async function optimizeDailyRouteService(driverId, dateStr) {
  // 1. Get store warehouse coordinates
  const store = await fetchStoreAndGeocode();
  if (!store) {
    throw new Error("Store warehouse profile details are missing");
  }

  // 2. Fetch daily scheduled orders
  const rawOrders = await getDailyOrdersForRouting(dateStr);
  if (!rawOrders || rawOrders.length === 0) {
    return null;
  }

  const stopsList = [];
  for (const order of rawOrders) {
    let lat = null;
    let lng = null;

    if (!order.delivery_address_id) {
      // Store collection: stop is located at the store warehouse
      lat = store.lat;
      lng = store.lng;
    } else {
      lat = order.d_lat ? parseFloat(order.d_lat) : null;
      lng = order.d_lng ? parseFloat(order.d_lng) : null;

      if (!lat || !lng || lat === 0 || lng === 0) {
        const fullAddress = `${order.d_address1 || ""}, ${order.d_city || ""}, ${order.d_state || ""} ${order.d_pincode || ""}`;
        const coords = await geocodeAddress(fullAddress, store.lat, store.lng, order.d_city, order.d_state, order.d_pincode);
        lat = coords.latitude;
        lng = coords.longitude;

        await updateAddressCoordinates(order.delivery_address_id, lat, lng);
      }
    }

    const orderStartOnly = new Date(order.start_date).toISOString().split("T")[0];
    const orderEndOnly = new Date(order.end_date).toISOString().split("T")[0];

    if (orderStartOnly === dateStr) {
      stopsList.push({
        order_id: order.rent_id,
        lat,
        lng,
        type: "delivery",
        order,
      });
    }
    if (orderEndOnly === dateStr) {
      stopsList.push({
        order_id: order.rent_id,
        lat,
        lng,
        type: "pickup",
        order,
      });
    }
  }

  if (stopsList.length === 0) {
    return null;
  }

  // 4. TSP optimization: Greedy Nearest Neighbor solver starting from the store
  const optimizedStops = [];
  let currentLat = store.lat;
  let currentLng = store.lng;
  const unvisited = [...stopsList];
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let closestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateHaversineDistance(
        currentLat,
        currentLng,
        unvisited[i].lat,
        unvisited[i].lng
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    const nextStop = unvisited.splice(closestIndex, 1)[0];
    totalDistance += minDistance;
    currentLat = nextStop.lat;
    currentLng = nextStop.lng;
    optimizedStops.push(nextStop);
  }

  // Add final distance back to store
  totalDistance += calculateHaversineDistance(
    currentLat,
    currentLng,
    store.lat,
    store.lng
  );

  // Estimate duration (30 km/h speed + 15 min buffer per stop)
  const travelDurationMinutes = Math.round((totalDistance / 30) * 60);
  const totalDurationMinutes = travelDurationMinutes + optimizedStops.length * 15;

  // 5. Save/Update Route and Stops in the Database
  let route = await getRouteByDate(dateStr);
  if (route) {
    await deleteStopsForRoute(route.route_id);
    await updateRouteTotals(route.route_id, totalDistance, totalDurationMinutes);
    route.total_distance_km = totalDistance;
    route.total_duration_minutes = totalDurationMinutes;
  } else {
    route = await createDeliveryRoute(
      driverId || null,
      dateStr,
      "pending",
      totalDistance,
      totalDurationMinutes
    );
  }

  const savedStops = [];
  let currentTime = new Date(`${dateStr}T09:00:00`); // route starts at 9:00 AM

  for (let i = 0; i < optimizedStops.length; i++) {
    const stop = optimizedStops[i];
    const sequence = i + 1;

    // Calculate arrival time: 15 mins buffer on previous, plus driving duration estimate
    const prevLat = i === 0 ? store.lat : optimizedStops[i - 1].lat;
    const prevLng = i === 0 ? store.lng : optimizedStops[i - 1].lng;
    const distanceToNext = calculateHaversineDistance(prevLat, prevLng, stop.lat, stop.lng);
    const driveMinutes = Math.round((distanceToNext / 30) * 60);

    currentTime = new Date(currentTime.getTime() + driveMinutes * 60000);

    const savedStop = await createRouteStop(
      route.route_id,
      stop.order_id,
      sequence,
      stop.type,
      "pending",
      currentTime
    );

    // Add buffer time for delivery/pickup for next calculation
    currentTime = new Date(currentTime.getTime() + 15 * 60000);

    savedStops.push({
      ...savedStop,
      product_name: stop.order.product_name,
      first_name: stop.order.first_name,
      last_name: stop.order.last_name,
      email: stop.order.email,
      d_address1: stop.order.d_address1,
      d_address2: stop.order.d_address2,
      d_city: stop.order.d_city,
      d_state: stop.order.d_state,
      d_pincode: stop.order.d_pincode,
      d_lat: stop.lat,
      d_lng: stop.lng,
    });
  }

  return {
    route,
    stops: savedStops,
    store,
  };
}

export async function getDailyRouteService(dateStr) {
  const store = await fetchStoreAndGeocode();
  const route = await getRouteByDate(dateStr);
  if (!route) {
    return null;
  }

  const stops = await getRouteStops(route.route_id);
  return {
    route,
    stops,
    store,
  };
}
