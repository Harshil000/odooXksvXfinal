import { useEffect, useState } from "react";
import { loadProductCards } from "../services/product.service";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const productCards = await loadProductCards();
        if (active) {
          setProducts(productCards);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err);
          console.error("Error fetching products:", err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  return { products, loading, error };
}
