import { useEffect, useState, useCallback } from "react";
import { loadProductCards } from "../services/product.service";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 8; // Load 8 products at a time

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const data = await loadProductCards(LIMIT, offset);
      const newProducts = data.products || [];
      
      setProducts(prev => {
        const merged = [...prev];
        newProducts.forEach(np => {
          if (!merged.some(item => item.id === np.id)) {
            merged.push(np);
          }
        });
        return merged;
      });

      setAttributes(prev => {
        const merged = [...prev];
        (data.attributes || []).forEach(na => {
          if (!merged.some(item => item.p_id === na.p_id && item.attri_id === na.attri_id && item.value_id === na.value_id)) {
            merged.push(na);
          }
        });
        return merged;
      });

      if (newProducts.length < LIMIT) {
        setHasMore(false);
      }
      setOffset(prev => prev + LIMIT);
      setError(null);
    } catch (err) {
      setError(err);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [offset, loading, hasMore]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []);

  return { products, attributes, loading, error, hasMore, loadMore };
}
