import { createContext, useState, useEffect, useContext } from "react";
import { fetchCart, addItemToCart, updateCartItem, deleteCartItem, clearUserCart } from "../api/cart.api";
import { mapCartItem, calculateCartTotals } from "../services/cart.service";
import { AuthContext } from "../../auth/auth.context";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchCart();
      const mapped = (data.cart || []).map(mapCartItem);
      setCartItems(mapped);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  // Reload cart on login/user change
  useEffect(() => {
    loadCart();
  }, [user]);

  const addToCartAction = async (p_id, r_id, quantity, startDate, endDate) => {
    if (!user) {
      alert("Please log in to add products to the cart.");
      return false;
    }
    try {
      setLoading(true);
      await addItemToCart({ p_id, r_id, quantity, start_date: startDate, end_date: endDate });
      await loadCart();
      return true;
    } catch (err) {
      alert(err.message || "Failed to add to cart");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItemQtyAction = async (cartItemId, quantity) => {
    try {
      setLoading(true);
      // Fetch the item to keep its dates intact
      const item = cartItems.find((i) => i.id === cartItemId);
      if (!item) return;

      await updateCartItem(cartItemId, {
        quantity,
        start_date: item.startDate,
        end_date: item.endDate,
      });
      await loadCart();
    } catch (err) {
      alert(err.message || "Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const removeItemAction = async (cartItemId) => {
    try {
      setLoading(true);
      await deleteCartItem(cartItemId);
      await loadCart();
    } catch (err) {
      alert(err.message || "Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const clearCartAction = async () => {
    try {
      setLoading(true);
      await clearUserCart();
      setCartItems([]);
    } catch (err) {
      alert(err.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateCartTotals(cartItems);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        totals,
        addToCart: addToCartAction,
        updateQty: updateItemQtyAction,
        removeItem: removeItemAction,
        clearCart: clearCartAction,
        refreshCart: loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
