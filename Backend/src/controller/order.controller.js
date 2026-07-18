import {
  createRentingOrder,
  getAllRentingOrders,
  getRentingOrderById,
  updateRentingOrderStatus,
  deleteRentingOrder,
} from "../repository/order.repository.js";

// ==========================================
// RENTING ORDERS
// ==========================================

export async function createOrderController(req, res, next) {
  try {
    const { r_id, asset_id, email, start_date, end_date, delivery_status, total } = req.body;

    if (!r_id) return res.status(400).json({ message: "Rent Plan ID (r_id) is required" });
    if (!asset_id) return res.status(400).json({ message: "Asset ID (asset_id) is required" });
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!start_date) return res.status(400).json({ message: "Start date is required" });
    if (!end_date) return res.status(400).json({ message: "End date is required" });
    if (!delivery_status) return res.status(400).json({ message: "Delivery status is required" });
    if (total === undefined) return res.status(400).json({ message: "Total price is required" });

    const orderData = { r_id, asset_id, email, start_date, end_date, delivery_status, total };
    const order = await createRentingOrder(orderData);

    return res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    next(error);
  }
}

export async function getAllOrdersController(req, res, next) {
  try {
    const orders = await getAllRentingOrders();
    return res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getOrderByIdController(req, res, next) {
  try {
    const { rent_id } = req.params;
    if (!rent_id) return res.status(400).json({ message: "Order ID is required" });

    const order = await getRentingOrderById(rent_id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    return res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusController(req, res, next) {
  try {
    const { rent_id } = req.params;
    const { delivery_status } = req.body;

    if (!rent_id) return res.status(400).json({ message: "Order ID is required" });
    if (!delivery_status) return res.status(400).json({ message: "Delivery status is required" });

    const order = await updateRentingOrderStatus(rent_id, delivery_status);
    if (!order) return res.status(404).json({ message: "Order not found" });

    return res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    next(error);
  }
}

export async function deleteOrderController(req, res, next) {
  try {
    const { rent_id } = req.params;
    if (!rent_id) return res.status(400).json({ message: "Order ID is required" });

    const deleted = await deleteRentingOrder(rent_id);
    if (!deleted) return res.status(404).json({ message: "Order not found" });

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    next(error);
  }
}
