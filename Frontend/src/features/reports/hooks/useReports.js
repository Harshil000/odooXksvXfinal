import { useEffect, useState } from "react";
import { loadMonthlyProductSales } from "../services/reports.service";
import { getCurrentMonthValue } from "../utils/report.util";

export function useReports() {
  const [monthValue, setMonthValue] = useState(getCurrentMonthValue());
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({
    orderCount: 0,
    quantity: 0,
    sales: 0,
    deposits: 0,
    penalties: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchReport() {
      try {
        setLoading(true);
        const report = await loadMonthlyProductSales(monthValue);
        if (active) {
          setRows(report.rows);
          setTotals(report.totals);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err);
          console.error("Error loading reports:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchReport();

    return () => {
      active = false;
    };
  }, [monthValue]);

  return {
    monthValue,
    setMonthValue,
    rows,
    totals,
    loading,
    error,
  };
}
