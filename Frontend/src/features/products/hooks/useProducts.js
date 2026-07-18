import { useEffect, useState } from "react";
import { loadProductCards } from "../services/product.service";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const data = await loadProductCards();
        if (active) {
          setProducts(data.products);
          setAttributes(data.attributes || []);
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

  return { products, attributes, loading, error };
}
