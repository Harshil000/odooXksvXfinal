import {
  createRentingOrder,
  getAllRentingOrders,
  getRentingOrderById,
  updateRentingOrderStatus,
  deleteRentingOrder,
  getAllEnrichedOrders,
  getRentingOrdersByUser,
} from "../repository/order.repository.js";
import { findVendorById } from "../repository/vendor.repository.js";
import { sendInvoiceEmail } from "../service/invoice-mail.service.js";
import { findUserByEmail } from "../repository/user.repository.js";
import { createAddress, findAddressesByUserId } from "../repository/address.repository.js";

// ==========================================
// RENTING ORDERS
// ==========================================

export async function createOrderController(req, res, next) {
  try {
    const {
      r_id,
      asset_id,
      email,
      start_date,
      end_date,
      delivery_status,
      total,
      invoice_status,
      invoice_address_id,
      delivery_address_id,
      invoiceAddress,
      deliveryAddress,
    } = req.body;

    if (!r_id) return res.status(400).json({ message: "Rent Plan ID (r_id) is required" });
    if (!asset_id) return res.status(400).json({ message: "Asset ID (asset_id) is required" });
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!start_date) return res.status(400).json({ message: "Start date is required" });
    if (!end_date) return res.status(400).json({ message: "End date is required" });
    if (!delivery_status) return res.status(400).json({ message: "Delivery status is required" });
    if (total === undefined) return res.status(400).json({ message: "Total price is required" });

    // Try to find if a customer user exists for this email
    const customer = await findUserByEmail(email);
    const resolvedUserId = customer ? customer.u_id : null;

    let resolvedInvoiceAddressId = invoice_address_id;
    if (!resolvedInvoiceAddressId && invoiceAddress && invoiceAddress.address_line1) {
      const addr = await createAddress({
        pincode: invoiceAddress.pincode || "",
        state: invoiceAddress.state || "",
        city: invoiceAddress.city || "",
        address_line1: invoiceAddress.address_line1,
        address_line2: invoiceAddress.address_line2 || null,
        u_id: resolvedUserId,
      });
      resolvedInvoiceAddressId = addr.address_id;
    }

    let resolvedDeliveryAddressId = delivery_address_id;
    if (!resolvedDeliveryAddressId && deliveryAddress && deliveryAddress.address_line1) {
      const addr = await createAddress({
        pincode: deliveryAddress.pincode || "",
        state: deliveryAddress.state || "",
        city: deliveryAddress.city || "",
        address_line1: deliveryAddress.address_line1,
        address_line2: deliveryAddress.address_line2 || null,
        u_id: resolvedUserId,
      });
      resolvedDeliveryAddressId = addr.address_id;
    }

    const orderData = {
      r_id,
      asset_id,
      email,
      start_date,
      end_date,
      delivery_status,
      total,
      invoice_status,
      u_id: resolvedUserId,
      invoice_address_id: resolvedInvoiceAddressId,
      delivery_address_id: resolvedDeliveryAddressId,
    };
    const order = await createRentingOrder(orderData);

    return res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerDetailsController(req, res, next) {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(200).json({ exists: false, addresses: [] });
    }

    const addresses = await findAddressesByUserId(user.u_id);
    return res.status(200).json({
      exists: true,
      user: {
        u_id: user.u_id,
        email: user.email,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email
      },
      addresses: addresses || []
    });
  } catch (error) {
    next(error);
  }
}


export async function sendInvoiceController(req, res, next) {
  try {
    const { customerEmail, invoiceNumber, invoiceDate, invoiceAddress, deliveryAddress, lines, totals } = req.body;

    if (!customerEmail) return res.status(400).json({ message: "Customer email is required" });
    if (!invoiceNumber) return res.status(400).json({ message: "Invoice number is required" });

    await sendInvoiceEmail({
      to: customerEmail,
      invoiceNumber,
      invoiceDate,
      invoiceAddress,
      deliveryAddress,
      lines,
      totals,
    });

    return res.status(200).json({ message: "Invoice sent successfully" });
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

// ==========================================
// DASHBOARD — Enriched Orders
// ==========================================

export async function getDashboardOrdersController(req, res, next) {
  try {
    // Resolve vendor's company from JWT payload
    const vendor = await findVendorById(req.user.id);
    if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });

    const orders = await getAllEnrichedOrders(vendor.c_id);
    return res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrdersController(req, res, next) {
  try {
    const u_id = req.user?.id;
    if (!u_id) return res.status(401).json({ message: "Unauthorized" });

    const orders = await getRentingOrdersByUser(u_id);
    return res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
}
