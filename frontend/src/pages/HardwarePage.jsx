import { useState } from "react";
import { T, HW_EMOJI, STATUS } from "../components/tokens.js";
import Avatar from "../components/Avatar.jsx";
import Badge from "../components/Badge.jsx";
import Btn from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";

// Mock data
const INITIAL_EMPLOYEES = [
  { id: 1, employeeNumber: "EMP-001", firstName: "Maximilian", lastName: "Bauer",  active: true },
  { id: 2, employeeNumber: "EMP-002", firstName: "Sophie",     lastName: "Müller", active: true },
  { id: 3, employeeNumber: "EMP-003", firstName: "Jonas",      lastName: "Weber",  active: true },
];
const INITIAL_HARDWARE = [
  { id: 1, assetTag: "HW-0001", name: 'MacBook Pro 16"',      category: "LAPTOP",  manufacturer: "Apple",  model: "MK183D/A",  serialNumber: "C02XY12345", status: "AVAILABLE", purchasePrice: 2899, warrantyUntil: "2025-06-01" },
  { id: 2, assetTag: "HW-0002", name: 'Dell UltraSharp 27"',  category: "MONITOR", manufacturer: "Dell",   model: "U2722D",    serialNumber: "D3L7890",   status: "LOANED",    purchasePrice: 549,  warrantyUntil: "2025-06-15", loanedTo: 1 },
  { id: 3, assetTag: "HW-0003", name: "ThinkPad X1 Carbon",   category: "LAPTOP",  manufacturer: "Lenovo", model: "Gen 10",    serialNumber: "LNV4567",   status: "AVAILABLE", purchasePrice: 1899, warrantyUntil: "2024-11-10" },
  { id: 4, assetTag: "HW-0004", name: 'iPad Pro 12.9"',       category: "TABLET",  manufacturer: "Apple",  model: "MNXR3FD/A", serialNumber: "DMPH1234",  status: "AVAILABLE", purchasePrice: 1299, warrantyUntil: "2026-02-20" },
];
const INITIAL_LOANS = [
  { id: 1, hardwareId: 2, employeeId: 1, loanDate: "2024-11-01", returnedAt: null },
];

const FILTER_LABELS = {
  ALL:         "Alle",
  AVAILABLE:   "Verfügbar",
  LOANED:      "Ausgeliehen",
  MAINTENANCE: "Wartung",
  RETIRED:     "Ausgemustert",
};

// ── Loan Dialog ──────────────────────────────────────────────
function LoanDialog({ hardware, employees, loans, onLoan, onReturn, onClose }) {
  const activeLoan = loans.find((l) => l.hardwareId === hardware.id && !l.returnedAt);
  const loanee = activeLoan ? employees.find((e) => e.id === activeLoan.employeeId) : null;

  const [mode, setMode]           = useState(activeLoan ? "return" : "loan");
  const [employeeId, setEmployeeId] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);

  const handleAction = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    if (mode === "loan") {
      onLoan(hardware.id, Number(employeeId), returnDate, notes);
    } else {
      onReturn(hardware.id, notes);
    }
    setSaving(false);
    onClose();
  };

  const st = STATUS[hardware.status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", label: hardware.status };

  return (
    <Modal title={`${HW_EMOJI[hardware.category] || "🖥️"} ${hardware.name}`} onClose={onClose}>

      {/* Device info */}
      <div
        style={{
          marginBottom: 16,
          padding: "12px 14px",
          background: "#0f172a",
          borderRadius: "8px",
          border: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
              {hardware.name}
            </div>
            <div style={{ fontSize: 11, color: "#475569", fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#a5b4fc" }}>{hardware.assetTag}</span>
              {" · "}{hardware.manufacturer} {hardware.model}
            </div>
          </div>
          <Badge label={st.label} color={st.color} bg={st.bg} sm />
        </div>
      </div>

      {activeLoan && loanee && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            background: "rgba(245,158,11,0.08)",
            borderRadius: "8px",
            border: "1px solid rgba(245,158,11,0.3)",
            fontSize: 13,
            color: "#f59e0b",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          ⚠️ Ausgeliehen an{" "}
          <strong style={{ color: "#fbbf24" }}>{loanee.firstName} {loanee.lastName}</strong>
          {" "}seit {activeLoan.loanDate}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {!activeLoan && (
          <Btn variant={mode === "loan" ? "primary" : "secondary"} onClick={() => setMode("loan")}>
            📤 Ausleihen
          </Btn>
        )}
        {activeLoan && (
          <Btn variant={mode === "return" ? "primary" : "secondary"} onClick={() => setMode("return")}>
            📥 Zurückgeben
          </Btn>
        )}
      </div>

      {mode === "loan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Select
            label="Mitarbeiter *"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={employees.filter((e) => e.active).map((e) => ({
              value: e.id,
              label: `${e.firstName} ${e.lastName} (${e.employeeNumber})`,
            }))}
          />
          <Input label="Geplantes Rückgabedatum" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          <Input label="Notizen" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optionale Bemerkung …" />
        </div>
      )}

      {mode === "return" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(16,185,129,0.08)",
              borderRadius: "8px",
              border: "1px solid rgba(16,185,129,0.3)",
              fontSize: 13,
              color: "#10b981",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ✅ Hardware wird von{" "}
            <strong style={{ color: "#34d399" }}>{loanee?.firstName} {loanee?.lastName}</strong>
            {" "}zurückgenommen und als "Verfügbar" markiert.
          </div>
          <Input label="Zustandsnotiz" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="z.B. Gerät in gutem Zustand …" />
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Abbrechen</Btn>
        <Btn onClick={handleAction} disabled={saving || (mode === "loan" && !employeeId)}>
          {saving ? "…" : mode === "loan" ? "📤 Ausleihen" : "📥 Zurückgeben"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Hardware Page ────────────────────────────────────────────
function HardwarePage({ toast }) {
  const [hardware, setHardware] = useState(INITIAL_HARDWARE);
  const [employees]             = useState(INITIAL_EMPLOYEES);
  const [loans, setLoans]       = useState(INITIAL_LOANS);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("ALL");
  const [loanDialog, setLoanDialog] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = hardware.filter((h) => {
    const matchSearch = `${h.name} ${h.assetTag} ${h.manufacturer}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || h.status === filter;
    return matchSearch && matchFilter;
  });

  const handleLoan = (hwId, empId, returnDate, notes) => {
    setLoans((l) => [
      ...l,
      { id: Date.now(), hardwareId: hwId, employeeId: empId, loanDate: new Date().toISOString().slice(0, 10), returnedAt: null, returnDate, notes },
    ]);
    setHardware((h) => h.map((hw) => (hw.id === hwId ? { ...hw, status: "LOANED" } : hw)));
    toast("Hardware erfolgreich ausgeliehen 📤");
  };

  const handleReturn = (hwId) => {
    setLoans((l) =>
      l.map((loan) => (loan.hardwareId === hwId && !loan.returnedAt ? { ...loan, returnedAt: new Date().toISOString() } : loan))
    );
    setHardware((h) => h.map((hw) => (hw.id === hwId ? { ...hw, status: "AVAILABLE" } : hw)));
    toast("Hardware zurückgenommen 📥");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }}
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hardware suchen …"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              borderRadius: "8px",
              border: `1px solid ${searchFocused ? "#6366f1" : "#334155"}`,
              fontSize: 13,
              outline: "none",
              background: "#0f172a",
              color: "#f1f5f9",
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: "border-box",
              boxShadow: searchFocused ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
              transition: "border-color 150ms ease, box-shadow 150ms ease",
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["ALL", "AVAILABLE", "LOANED", "MAINTENANCE", "RETIRED"].map((s) => {
            const active = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "20px",
                  border: `1px solid ${active ? "#6366f1" : "#334155"}`,
                  background: active ? "rgba(99,102,241,0.12)" : "#1e293b",
                  color: active ? "#a5b4fc" : "#64748b",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  whiteSpace: "nowrap",
                }}
              >
                {FILTER_LABELS[s] || s}
              </button>
            );
          })}
        </div>

        <Btn>＋ Hardware</Btn>
      </div>

      {/* Table */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#1e293b",
          borderRadius: "12px",
          border: "1px solid #334155",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0f172a" }}>
              {["", "Asset-Tag", "Gerät", "Kategorie", "Status", "Garantie", "Zugewiesen an", ""].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "'DM Sans', sans-serif",
                    borderBottom: "1px solid #334155",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((hw, idx) => {
              const loan     = loans.find((l) => l.hardwareId === hw.id && !l.returnedAt);
              const assignee = loan ? employees.find((e) => e.id === loan.employeeId) : null;
              const st       = STATUS[hw.status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", label: hw.status };
              const warrantyExpired = new Date(hw.warrantyUntil) < new Date();

              return (
                <tr
                  key={hw.id}
                  style={{
                    fontSize: 13,
                    borderBottom: idx < filtered.length - 1 ? "1px solid #334155" : "none",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 14px", fontSize: 20, lineHeight: 1 }}>
                    {HW_EMOJI[hw.category] || "🖥️"}
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <code
                      style={{
                        fontSize: 13,
                        background: "rgba(99,102,241,0.1)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        color: "#a5b4fc",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {hw.assetTag}
                    </code>
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <div style={{ fontWeight: 500, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
                      {hw.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                      {hw.manufacturer} · {hw.model}
                    </div>
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <Badge label={hw.category} color="#94a3b8" bg="rgba(148,163,184,0.1)" sm />
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <Badge label={st.label} color={st.color} bg={st.bg} sm />
                  </td>
                  <td
                    style={{
                      padding: "14px 14px",
                      color: warrantyExpired ? "#ef4444" : "#64748b",
                      fontSize: 12,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {new Date(hw.warrantyUntil).toLocaleDateString("de-DE")}
                    {warrantyExpired && " ⚠️"}
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    {assignee ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={`${assignee.firstName} ${assignee.lastName}`} size={24} />
                        <span style={{ fontSize: 12, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
                          {assignee.firstName} {assignee.lastName}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#334155", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    {hw.status !== "RETIRED" && (
                      <Btn sm variant="secondary" onClick={() => setLoanDialog(hw)}>
                        {hw.status === "LOANED" ? "📥 Rückgabe" : "📤 Ausleihen"}
                      </Btn>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loanDialog && (
        <LoanDialog
          hardware={loanDialog}
          employees={employees}
          loans={loans}
          onLoan={handleLoan}
          onReturn={handleReturn}
          onClose={() => setLoanDialog(null)}
        />
      )}
    </div>
  );
}

export default HardwarePage;
