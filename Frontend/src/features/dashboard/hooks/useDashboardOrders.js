import { useCallback, useEffect, useState, useMemo } from "react";
import { loadDashboardOrders, computeOrderStats } from "../services/dashboard.service";

export function useDashboardOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(null); // 'today' | 'pickup' | 'return' | 'late' | null
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);

  const refreshOrders = useCallback(async () => {
    try {
      const rows = await loadDashboardOrders();
      setOrders(rows);
      setError(null);
    } catch (err) {
      setError(err);
      console.error("Error fetching dashboard orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchOrders() {
      try {
        const rows = await loadDashboardOrders();
        if (active) {
          setOrders(rows);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err);
          console.error("Error fetching dashboard orders:", err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Apply date filter (last 7 days based on created_at)
    if (dateFilterEnabled) {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter((o) => {
        const created = new Date(o.createdAt);
        return created >= sevenDaysAgo;
      });
    }

    // Apply status filter pills
    if (activeFilter === "today") {
      result = result.filter((o) => {
        const s = o.pickupDate ? new Date(o.pickupDate).toISOString().split("T")[0] : null;
        const e = o.returnDate ? new Date(o.returnDate).toISOString().split("T")[0] : null;
        return s <= todayStr && e >= todayStr;
      });
    } else if (activeFilter === "pickup") {
      result = result.filter((o) => {
        const s = o.pickupDate ? new Date(o.pickupDate).toISOString().split("T")[0] : null;
        return s >= todayStr && o.status === "reserved";
      });
    } else if (activeFilter === "return") {
      result = result.filter((o) => {
        const e = o.returnDate ? new Date(o.returnDate).toISOString().split("T")[0] : null;
        return e <= todayStr && o.status === "picked_up";
      });
    } else if (activeFilter === "late") {
      result = result.filter((o) => {
        const e = o.returnDate ? new Date(o.returnDate).toISOString().split("T")[0] : null;
        return e < todayStr && !["returned", "cancelled"].includes(o.status);
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderRef.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.productName?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, searchQuery, activeFilter, dateFilterEnabled]);

  return {
    orders: filteredOrders,
    allOrders: orders,
    stats,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    dateFilterEnabled,
    setDateFilterEnabled,
    refresh: refreshOrders,
    setOrders,
  };
}
