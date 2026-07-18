import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { fetchQuotations } from "../api/quotation.api";
import "../styles/QuotationsList.scss";

function formatCurrency(amount) {
  return `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

const Quotations = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuotations() {
      try {
        const response = await fetchQuotations();
        setQuotations(response.quotations || []);
      } catch (err) {
        console.error("Failed to load quotations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuotations();
  }, []);

  const filteredQuotations = quotations.filter((q) => {
    const query = searchQuery.toLowerCase();
    return (
      q.customer_name.toLowerCase().includes(query) ||
      q.customer_email.toLowerCase().includes(query) ||
      q.product_name.toLowerCase().includes(query) ||
      `#q-${q.q_id}`.includes(query)
    );
  });

  return (
    <div className="quotations-page">
      <Navbar activeSection="quotation" searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search quotations..." />

      <div className="quotations-content">
        <div className="page-header">
          <h2>Quotations</h2>
          <button className="btn-create" onClick={() => navigate("/dashboard/new-order")}>
            + Create Quotation
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#a1a1aa" }}>Loading quotations...</div>
        ) : filteredQuotations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#a1a1aa", background: "#14141a", border: "1px solid #27272a", borderRadius: "8px" }}>
            No quotations found. Click "Create Quotation" to generate one.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Quote ID</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Sent At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q) => (
                  <tr key={q.q_id} onClick={() => navigate(`/dashboard/new-order?q_id=${q.q_id}`)}>
                    <td>#Q-{q.q_id}</td>
                    <td>{q.customer_name}</td>
                    <td>{q.customer_email}</td>
                    <td>{q.product_name}</td>
                    <td>{q.quantity}</td>
                    <td>{formatCurrency(q.total)}</td>
                    <td>{new Date(q.sent_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${q.status}`}>
                        {q.status === "converted" ? "Rental Order" : q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotations;
