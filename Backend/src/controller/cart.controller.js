import {
  addToCart,
  getCartByUserId,
  updateCartItem,
  deleteCartItem,
  clearCart,
} from "../repository/cart.repository.js";

export async function getCartController(req, res, next) {
  try {
    const u_id = req.user.id;
    const cart = await getCartByUserId(u_id);
    return res.status(200).json({ cart });
  } catch (error) {
    next(error);
  }
}

export async function addToCartController(req, res, next) {
  try {
    const u_id = req.user.id;
    const { p_id, r_id, quantity, start_date, end_date } = req.body;

    if (!p_id) return res.status(400).json({ message: "Product ID (p_id) is required" });
    if (!r_id) return res.status(400).json({ message: "Rent Plan ID (r_id) is required" });

    const cartData = {
      u_id,
      p_id,
      r_id,
      quantity: Number(quantity || 1),
      start_date: start_date || null,
      end_date: end_date || null,
    };

    const cartItem = await addToCart(cartData);
    return res.status(201).json({ message: "Added to cart successfully", cartItem });
  } catch (error) {
    next(error);
  }
}

export async function updateCartItemController(req, res, next) {
  try {
    const { cart_item_id } = req.params;
    const { quantity, start_date, end_date } = req.body;

    if (!cart_item_id) return res.status(400).json({ message: "Cart Item ID is required" });
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }

    const updated = await updateCartItem(cart_item_id, quantity, start_date, end_date);
    if (!updated) return res.status(404).json({ message: "Cart item not found" });

    return res.status(200).json({ message: "Cart item updated successfully", cartItem: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteCartItemController(req, res, next) {
  try {
    const { cart_item_id } = req.params;
    if (!cart_item_id) return res.status(400).json({ message: "Cart Item ID is required" });

    const deleted = await deleteCartItem(cart_item_id);
    if (!deleted) return res.status(404).json({ message: "Cart item not found" });

    return res.status(200).json({ message: "Cart item removed successfully" });
  } catch (error) {
    next(error);
  }
}

export async function clearCartController(req, res, next) {
  try {
    const u_id = req.user.id;
    await clearCart(u_id);
    return res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    next(error);
  }
}
