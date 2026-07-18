import { useEffect, useState, useCallback } from "react";
import { loadProductCards } from "../services/product.service";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 8; // Load 8 products at a time

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const productCards = await loadProductCards(LIMIT, offset);
      if (productCards.length < LIMIT) {
        setHasMore(false);
      }
      setProducts((prev) => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNew = productCards.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setOffset((prev) => prev + LIMIT);
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

  return { products, loading, error, hasMore, loadMore };
}
