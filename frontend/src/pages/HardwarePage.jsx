import { useState, useEffect } from "react";
import api from "../api/index.js";
import { T, HW_EMOJI, STATUS } from "../components/tokens.js";
import Avatar from "../components/Avatar.jsx";
import Badge from "../components/Badge.jsx";
import Btn from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";
import Spinner from "../components/Spinner.jsx";
import { exportCSV } from "../utils/csvExport.js";
import { downloadPdf } from "../utils/pdfDownload.js";
import Pagination from "../components/Pagination.jsx";
import ImportDialog from "../components/ImportDialog.jsx";

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

// ── Hardware Form Modal ──────────────────────────────────────
function HardwareFormModal({ hardware, onSave, onClose, toast }) {
  const initial = hardware ?? {
    assetTag: "", name: "", category: "LAPTOP", manufacturer: "", model: "",
    serialNumber: "", purchasePrice: "", warrantyUntil: "", status: "AVAILABLE", notes: "",
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.assetTag) e.assetTag = "Pflichtfeld";
    if (!form.name) e.name = "Pflichtfeld";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null };
      const result = form.id
        ? await api.put(`/hardware/${form.id}`, payload)
        : await api.post("/hardware", payload);
      onSave(result);
    } catch (err) {
      toast?.(err?.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={hardware ? "Hardware bearbeiten" : "Neue Hardware"} onClose={onClose} width={600}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input label="Asset-Tag" value={form.assetTag} onChange={(e) => set("assetTag", e.target.value)} required error={errors.assetTag} placeholder="HW-0005" />
        <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} required error={errors.name} placeholder='MacBook Pro 16"' />
        <Select label="Kategorie" value={form.category} onChange={(e) => set("category", e.target.value)} options={["LAPTOP", "MONITOR", "TABLET", "PHONE", "DESKTOP", "ACCESSORY"]} />
        <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={["AVAILABLE", "LOANED", "MAINTENANCE", "RETIRED"]} />
        <Input label="Hersteller" value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="Apple" />
        <Input label="Modell" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="MK183D/A" />
        <Input label="Seriennummer" value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />
        <Input label="Kaufpreis (€)" type="number" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder="2899" />
        <Input label="Garantie bis" type="date" value={form.warrantyUntil} onChange={(e) => set("warrantyUntil", e.target.value)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>Notizen</label>
          <textarea
            value={form.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Interne Bemerkungen …"
            rows={3}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155", fontSize: 13, color: "#f1f5f9", background: "#0f172a", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", resize: "vertical" }}
          />
        </div>
      </div>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Abbrechen</Btn>
        <Btn onClick={handleSave} disabled={saving}>{saving ? "Speichern …" : "Speichern"}</Btn>
      </div>
    </Modal>
  );
}

// ── Hardware Page ────────────────────────────────────────────
function HardwarePage({ toast }) {
  const [hardware, setHardware] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loans, setLoans]       = useState([]);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("ALL");
  const [loanDialog, setLoanDialog] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editHw, setEditHw] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    Promise.all([
      api.get("/hardware?size=200").then((data) => { if (data?.content) setHardware(data.content); }),
      api.get("/employees?size=200").then((data) => { if (data?.content) setEmployees(data.content); }),
    ]).catch(() => toast?.("Hardware konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  // Page zurücksetzen bei Filter-/Suche-Änderung
  useEffect(() => { setPage(0); }, [search, filter]);

  const filtered = hardware.filter((h) => {
    const matchSearch = `${h.name} ${h.assetTag} ${h.manufacturer}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || h.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/hardware/${id}`);
      setHardware((prev) => prev.filter((h) => h.id !== id));
      setConfirmDelete(null);
      toast("Hardware gelöscht");
    } catch (err) {
      toast(err?.message || "Löschen fehlgeschlagen");
    }
  };

  const handleLoan = async (hwId, empId, returnDate, notes) => {
    try {
      await api.post(`/loans/hardware/${hwId}/loan`, {
        employeeId: empId,
        returnDate: returnDate || null,
        notes: notes || null,
      });
      setHardware((h) => h.map((hw) => (hw.id === hwId ? { ...hw, status: "LOANED" } : hw)));
      toast("Hardware erfolgreich ausgeliehen");
    } catch (err) {
      toast(err?.message || "Ausleihe fehlgeschlagen");
    }
  };

  const handleReturn = async (hwId) => {
    try {
      await api.post(`/loans/hardware/${hwId}/return`);
      setHardware((h) => h.map((hw) => (hw.id === hwId ? { ...hw, status: "AVAILABLE" } : hw)));
      toast("Hardware zurückgenommen");
    } catch (err) {
      toast(err?.message || "Rückgabe fehlgeschlagen");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      {loading && <Spinner text="Hardware laden …" />}
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

        <Btn variant="secondary" onClick={() => downloadPdf("/reports/hardware", "Hardware-Inventar.pdf").catch(() => toast("PDF fehlgeschlagen"))}>PDF</Btn>
        <Btn variant="secondary" onClick={() => setShowImport(true)}>CSV Import</Btn>
        <Btn variant="secondary" onClick={() => exportCSV(hardware, [
          { key: "assetTag", label: "Asset-Tag" }, { key: "name", label: "Name" },
          { key: "category", label: "Kategorie" }, { key: "manufacturer", label: "Hersteller" },
          { key: "model", label: "Modell" }, { key: "serialNumber", label: "Seriennummer" },
          { key: "status", label: "Status" }, { key: "purchasePrice", label: "Kaufpreis" },
          { key: "warrantyUntil", label: "Garantie bis" }, { key: "notes", label: "Notizen" },
        ], "Hardware")}>CSV Export</Btn>
        <Btn onClick={() => setShowForm(true)}>＋ Hardware</Btn>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

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
            {paged.map((hw, idx) => {
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
                    {hw.notes && (
                      <div style={{ fontSize: 11, color: "#6366f1", marginTop: 3, fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}
                        title={hw.notes}>
                        {hw.notes.length > 40 ? hw.notes.substring(0, 40) + "…" : hw.notes}
                      </div>
                    )}
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
                    <div style={{ display: "flex", gap: 4 }}>
                      {hw.status !== "RETIRED" && (
                        <Btn sm variant="secondary" onClick={() => setLoanDialog(hw)}>
                          {hw.status === "LOANED" ? "Rückgabe" : "Ausleihen"}
                        </Btn>
                      )}
                      <Btn sm variant="secondary" onClick={() => { setEditHw(hw); setShowForm(true); }}>Bearbeiten</Btn>
                      <Btn sm variant="danger" onClick={() => setConfirmDelete(hw)}>Löschen</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

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

      {showForm && (
        <HardwareFormModal
          hardware={editHw}
          onSave={(saved) => {
            setHardware((prev) => {
              const exists = prev.find((h) => h.id === saved.id);
              return exists ? prev.map((h) => (h.id === saved.id ? saved : h)) : [...prev, saved];
            });
            setShowForm(false);
            setEditHw(null);
            toast(editHw ? "Hardware gespeichert" : "Hardware angelegt");
          }}
          onClose={() => { setShowForm(false); setEditHw(null); }}
          toast={toast}
        />
      )}

      {confirmDelete && (
        <Modal title="Hardware löschen" onClose={() => setConfirmDelete(null)} width={420}>
          <p style={{ color: "#cbd5e1", fontSize: 14, fontFamily: "'DM Sans', sans-serif", margin: "0 0 20px" }}>
            Soll <strong style={{ color: "#f1f5f9" }}>{confirmDelete.name}</strong> ({confirmDelete.assetTag}) wirklich gelöscht werden?
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>Abbrechen</Btn>
            <Btn variant="danger" onClick={() => handleDelete(confirmDelete.id)}>Löschen</Btn>
          </div>
        </Modal>
      )}

      {showImport && (
        <ImportDialog
          title="Hardware importieren"
          endpoint="hardware"
          onDone={() => { api.get("/hardware?size=200").then((d) => { if (d?.content) setHardware(d.content); }); }}
          onClose={() => setShowImport(false)}
          toast={toast}
        />
      )}
    </div>
  );
}

export default HardwarePage;
