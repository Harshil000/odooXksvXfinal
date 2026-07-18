import {
  optimizeDailyRouteService,
  getDailyRouteService,
} from "../service/deliveryRoute.service.js";
import { updateStopStatus } from "../repository/deliveryRoute.repository.js";

export async function getDailyRouteController(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date query parameter is required (YYYY-MM-DD)" });
    }

    let data = await getDailyRouteService(date);
    if (!data) {
      // Lazy optimize/build if no route exists yet
      data = await optimizeDailyRouteService(req.user?.u_id || null, date);
    }

    return res.status(200).json({
      success: true,
      route: data?.route || null,
      stops: data?.stops || [],
      store: data?.store || null,
    });
  } catch (error) {
    next(error);
  }
}

export async function optimizeDailyRouteController(req, res, next) {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ message: "Date is required inside request body (YYYY-MM-DD)" });
    }

    const data = await optimizeDailyRouteService(req.user?.u_id || null, date);

    return res.status(200).json({
      success: true,
      message: "Route successfully optimized!",
      route: data?.route || null,
      stops: data?.stops || [],
      store: data?.store || null,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStopStatusController(req, res, next) {
  try {
    const { stop_id } = req.params;
    const { status } = req.body;

    if (!stop_id) {
      return res.status(400).json({ message: "Stop ID parameter is required" });
    }
    if (!status) {
      return res.status(400).json({ message: "Status value is required" });
    }

    const updatedStop = await updateStopStatus(stop_id, status, new Date());
    if (!updatedStop) {
      return res.status(404).json({ message: "Stop not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Stop status updated successfully",
      stop: updatedStop,
    });
  } catch (error) {
    next(error);
  }
}
