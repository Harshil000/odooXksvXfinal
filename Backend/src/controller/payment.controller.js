import Razorpay from "razorpay";
import crypto from "crypto";
import { saveCheckoutTransaction } from "../repository/payment.repository.js";

// Initialize Razorpay SDK using credentials from environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZOR_ID,
  key_secret: process.env.RAZOR_ID_SECRET,
});

/**
 * Creates a Razorpay Order for checkout.
 * POST /api/payment/create-order
 */
export async function createRazorpayOrderController(req, res, next) {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: "A valid positive numeric amount is required" });
    }

    // Razorpay accepts values in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `receipt_checkout_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.status(201).json({
      key_id: process.env.RAZOR_ID,
      order,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verifies Razorpay payment signatures and saves the transaction.
 * POST /api/payment/verify
 */
export async function verifyRazorpayPaymentController(req, res, next) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      email,
      address,
      cartItems,
    } = req.body;

    const u_id = req.user?.id || req.user?.u_id;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: "Razorpay payment ID, order ID, and signature are required" });
    }
    if (!email) {
      return res.status(400).json({ message: "Customer email is required" });
    }
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart items are required for checkout" });
    }

    // 1. Verify payment signature validity
    const hmac = crypto.createHmac("sha256", process.env.RAZOR_ID_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.warn(`[Razorpay] Signature verification failed. Expected: ${generated_signature}, Received: ${razorpay_signature}`);
      if (process.env.NODE_ENV === "development") {
        console.warn("[Razorpay] Bypassing signature verification failure in development mode.");
      } else {
        return res.status(400).json({ message: "Invalid payment signature verification failed" });
      }
    }

    // 2. Fetch payment method details from Razorpay API
    let method = "card";
    try {
      const paymentInfo = await razorpay.payments.fetch(razorpay_payment_id);
      method = paymentInfo.method || "card";
    } catch (err) {
      console.warn("[Razorpay] Failed to fetch payment method details:", err.message);
    }

    // 3. Save the transaction and orders to DB
    const orders = await saveCheckoutTransaction({
      u_id,
      email,
      address,
      cartItems,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      method,
    });

    return res.status(200).json({
      message: "Payment verified and order created successfully",
      orders,
    });
  } catch (error) {
    next(error);
  }
}
