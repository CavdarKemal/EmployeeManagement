import { useState, useEffect } from "react";
import api from "../api/index.js";
import Badge from "../components/Badge.jsx";
import Spinner from "../components/Spinner.jsx";
import Pagination from "../components/Pagination.jsx";

const ACTION_COLORS = {
  POST:   { color: "#10b981", bg: "rgba(16,185,129,0.12)",  label: "Erstellt" },
  PUT:    { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  label: "Geändert" },
  PATCH:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "Aktualisiert" },
  DELETE: { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   label: "Gelöscht" },
};

function AuditLogPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch]   = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    const params = `size=${pageSize}&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    api.get(`/admin/audit-log?${params}`).then((data) => {
      if (data?.content) {
        setEntries(data.content);
        setTotalPages(data.totalPages);
      }
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Search */}
      <div style={{ position: "relative", maxWidth: 400 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }}>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Benutzer oder Pfad suchen …"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            width: "100%", padding: "10px 14px 10px 36px", borderRadius: "8px",
            border: `1px solid ${searchFocused ? "#6366f1" : "#334155"}`,
            fontSize: 13, outline: "none", background: "#0f172a", color: "#f1f5f9",
            fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
            boxShadow: searchFocused ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
          }}
        />
      </div>

      {loading ? <Spinner text="Audit-Log laden …" /> : (
        <>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#0f172a" }}>
                <tr>
                  {["Zeitpunkt", "Benutzer", "Aktion", "Pfad", "Status", "IP"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 600,
                      color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em",
                      fontFamily: "'DM Sans', sans-serif", borderBottom: "1px solid #334155",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const ac = ACTION_COLORS[e.action] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", label: e.action };
                  const isError = e.status >= 400;
                  return (
                    <tr key={e.id} style={{ borderBottom: i < entries.length - 1 ? "1px solid #334155" : "none", fontSize: 13 }}
                      onMouseEnter={(el) => (el.currentTarget.style.background = "rgba(99,102,241,0.04)")}
                      onMouseLeave={(el) => (el.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                        {new Date(e.createdAt).toLocaleString("de-DE")}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                        {e.username}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Badge label={ac.label} color={ac.color} bg={ac.bg} sm />
                      </td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                        {e.path}
                      </td>
                      <td style={{ padding: "10px 14px", color: isError ? "#ef4444" : "#10b981", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
                        {e.status}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                        {e.ipAddress}
                      </td>
                    </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>Keine Einträge gefunden</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default AuditLogPage;
