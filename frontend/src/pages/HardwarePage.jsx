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

  return (
    <Modal title={`${HW_EMOJI[hardware.category] || "🖥️"} ${hardware.name}`} onClose={onClose}>
      <div style={{ marginBottom: 16, padding: "12px 14px", background: T.bg, borderRadius: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{hardware.name}</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>{hardware.assetTag} · {hardware.manufacturer} {hardware.model}</div>
          </div>
          <Badge
            label={STATUS[hardware.status]?.label || hardware.status}
            color={STATUS[hardware.status]?.color}
            bg={STATUS[hardware.status]?.bg}
          />
        </div>
      </div>

      {activeLoan && loanee && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fef3c7", borderRadius: 9, border: "1px solid #fcd34d", fontSize: 13, color: "#92400e" }}>
          ⚠️ Ausgeliehen an <strong>{loanee.firstName} {loanee.lastName}</strong> seit {activeLoan.loanDate}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {!activeLoan && <Btn variant={mode === "loan"   ? "primary" : "ghost"} onClick={() => setMode("loan")}>📤 Ausleihen</Btn>}
        {activeLoan  && <Btn variant={mode === "return" ? "primary" : "ghost"} onClick={() => setMode("return")}>📥 Zurückgeben</Btn>}
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
          <div style={{ padding: "12px 14px", background: "#f0fdf4", borderRadius: 9, border: "1px solid #bbf7d0", fontSize: 13, color: "#166534" }}>
            ✅ Hardware wird von <strong>{loanee?.firstName} {loanee?.lastName}</strong> zurückgenommen und als "Verfügbar" markiert.
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
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hardware suchen …"
            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {["ALL", "AVAILABLE", "LOANED", "MAINTENANCE", "RETIRED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "7px 12px", borderRadius: 8,
                border: `1.5px solid ${filter === s ? T.primary : T.border}`,
                background: filter === s ? "#eef2ff" : "#fff",
                color: filter === s ? T.primary : T.textMuted,
                fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              {s === "ALL" ? "Alle" : STATUS[s]?.label || s}
            </button>
          ))}
        </div>
        <Btn>＋ Hardware</Btn>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
          <thead>
            <tr style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {["", "Asset-Tag", "Gerät", "Kategorie", "Status", "Garantie", "Zugewiesen an", ""].map((h, i) => (
                <th key={i} style={{ padding: "4px 10px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((hw) => {
              const loan     = loans.find((l) => l.hardwareId === hw.id && !l.returnedAt);
              const assignee = loan ? employees.find((e) => e.id === loan.employeeId) : null;
              const st       = STATUS[hw.status] || { color: "#999", bg: "#eee", label: hw.status };
              const warrantyExpired = new Date(hw.warrantyUntil) < new Date();
              return (
                <tr key={hw.id} style={{ fontSize: 13 }}>
                  <td style={{ padding: "11px 10px 11px 14px", background: "#fff", borderRadius: "11px 0 0 11px", border: `1px solid ${T.border}`, borderRight: "none", fontSize: 22 }}>
                    {HW_EMOJI[hw.category] || "🖥️"}
                  </td>
                  <td style={{ padding: "11px 10px", background: "#fff", border: `1px solid ${T.border}`, borderLeft: "none", borderRight: "none" }}>
                    <code style={{ fontSize: 11, background: T.bg, padding: "2px 7px", borderRadius: 5, color: T.primary }}>{hw.assetTag}</code>
                  </td>
                  <td style={{ padding: "11px 10px", background: "#fff", border: `1px solid ${T.border}`, borderLeft: "none", borderRight: "none" }}>
                    <div style={{ fontWeight: 700, color: T.text }}>{hw.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{hw.manufacturer} · {hw.model}</div>
                  </td>
                  <td style={{ padding: "11px 10px", background: "#fff", border: `1px solid ${T.border}`, borderLeft: "none", borderRight: "none" }}>
                    <Badge label={hw.category} color={T.text} bg={T.bg} sm />
                  </td>
                  <td style={{ padding: "11px 10px", background: "#fff", border: `1px solid ${T.border}`, borderLeft: "none", borderRight: "none" }}>
                    <Badge label={st.label} color={st.color} bg={st.bg} sm />
                  </td>
                  <td style={{ padding: "11px 10px", background: "#fff", border: `1px solid ${T.border}`, borderLeft: "none", borderRight: "none", color: warrantyExpired ? T.danger : T.textMuted, fontSize: 12 }}>
                    {new Date(hw.warrantyUntil).toLocaleDateString("de-DE")}{warrantyExpired && " ⚠️"}
                  </td>
                  <td style={{ padding: "11px 10px", background: "#fff", border: `1px solid ${T.border}`, borderLeft: "none", borderRight: "none" }}>
                    {assignee ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Avatar name={`${assignee.firstName} ${assignee.lastName}`} size={22} />
                        <span style={{ fontSize: 12 }}>{assignee.firstName} {assignee.lastName}</span>
                      </div>
                    ) : (
                      <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "11px 14px 11px 10px", background: "#fff", borderRadius: "0 11px 11px 0", border: `1px solid ${T.border}`, borderLeft: "none" }}>
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
