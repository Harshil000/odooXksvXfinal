const STATUS_CONFIG = {
  // Delivery statuses
  reserved: { label: "Reserved", className: "badge--reserved" },
  picked_up: { label: "Picked Up", className: "badge--picked-up" },
  late_picked: { label: "Late Picked", className: "badge--late-picked" },
  quotation: { label: "Quotation", className: "badge--quotation" },
  cancelled: { label: "Cancelled", className: "badge--cancelled" },
  returned: { label: "Returned", className: "badge--returned" },

  // Invoice statuses
  invoiced: { label: "Invoiced", className: "badge--invoiced" },
  confirmed: { label: "Confirmed", className: "badge--confirmed" },
  quotation_sent: { label: "Quotation Sent", className: "badge--quotation-sent" },
  nothing_to_invoice: { label: "Nothing to Invoice", className: "badge--nothing-to-invoice" },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status?.replace(/_/g, " ") || "Unknown",
    className: "badge--default",
  };

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
