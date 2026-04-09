function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const btnStyle = (active) => ({
    padding: "6px 12px",
    borderRadius: "6px",
    border: `1px solid ${active ? "#6366f1" : "#334155"}`,
    background: active ? "rgba(99,102,241,0.15)" : "transparent",
    color: active ? "#a5b4fc" : "#64748b",
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    fontFamily: "'DM Sans', sans-serif",
    cursor: active ? "default" : "pointer",
    transition: "all 150ms ease",
    minWidth: 34,
  });

  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "center", padding: "12px 0" }}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        style={{ ...btnStyle(false), opacity: page === 0 ? 0.3 : 1, cursor: page === 0 ? "not-allowed" : "pointer" }}
      >
        &laquo;
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`dots-${i}`} style={{ color: "#475569", fontSize: 12, padding: "0 4px" }}>…</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)} style={btnStyle(p === page)}>
            {p + 1}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        style={{ ...btnStyle(false), opacity: page >= totalPages - 1 ? 0.3 : 1, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer" }}
      >
        &raquo;
      </button>
      <span style={{ fontSize: 11, color: "#475569", fontFamily: "'DM Sans', sans-serif", marginLeft: 8 }}>
        Seite {page + 1} von {totalPages}
      </span>
    </div>
  );
}

export default Pagination;
