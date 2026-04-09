import { useState, useEffect } from "react";
import api from "../api/index.js";
import { T } from "../components/tokens.js";
import Btn from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";
import Spinner from "../components/Spinner.jsx";
import { exportCSV } from "../utils/csvExport.js";
import { downloadPdf } from "../utils/pdfDownload.js";
import Pagination from "../components/Pagination.jsx";
import ImportDialog from "../components/ImportDialog.jsx";

const CAT_EMOJI = { PRODUCTIVITY: "📊", DEV_TOOLS: "🛠️", DESIGN: "🎨", OS: "💾" };

const CAT_COLORS = {
  PRODUCTIVITY: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  DEV_TOOLS:    { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  DESIGN:       { color: "#ec4899", bg: "rgba(236,72,153,0.12)"  },
  OS:           { color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

// ── Software Form Modal ──────────────────────────────────────
function SoftwareFormModal({ software, onSave, onClose, toast }) {
  const initial = software ?? {
    name: "", vendor: "", version: "", category: "PRODUCTIVITY",
    licenseType: "SUBSCRIPTION", totalLicenses: 1, costPerLicense: "", renewalDate: "", notes: "",
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const handleSave = async () => {
    if (!form.name) { setErrors({ name: "Pflichtfeld" }); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        totalLicenses: Number(form.totalLicenses),
        costPerLicense: form.costPerLicense ? Number(form.costPerLicense) : null,
      };
      const result = form.id
        ? await api.put(`/software/${form.id}`, payload)
        : await api.post("/software", payload);
      onSave(result);
    } catch (err) {
      toast?.(err?.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={software ? "Software bearbeiten" : "Neue Software"} onClose={onClose} width={600}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} required error={errors.name} placeholder="Microsoft 365" />
        <Input label="Hersteller" value={form.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="Microsoft" />
        <Input label="Version" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="2024" />
        <Select label="Kategorie" value={form.category} onChange={(e) => set("category", e.target.value)} options={["PRODUCTIVITY", "DEV_TOOLS", "DESIGN", "OS"]} />
        <Select label="Lizenztyp" value={form.licenseType} onChange={(e) => set("licenseType", e.target.value)} options={["SUBSCRIPTION", "PERPETUAL", "OPEN_SOURCE"]} />
        <Input label="Anzahl Lizenzen" type="number" value={form.totalLicenses} onChange={(e) => set("totalLicenses", e.target.value)} placeholder="10" />
        <Input label="Kosten/Lizenz/Monat (€)" type="number" value={form.costPerLicense} onChange={(e) => set("costPerLicense", e.target.value)} placeholder="12.50" />
        <Input label="Erneuerungsdatum" type="date" value={form.renewalDate} onChange={(e) => set("renewalDate", e.target.value)} />
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

function SoftwarePage({ toast }) {
  const [software, setSoftware]   = useState([]);
  const [assignDialog, setAssignDialog] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [empId, setEmpId]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editSw, setEditSw]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/software?size=200").then((data) => { if (data?.content) setSoftware(data.content); }),
      api.get("/employees?size=200").then((data) => { if (data?.content) setEmployees(data.content); }),
    ]).catch(() => toast?.("Software konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/software/${id}`);
      setSoftware((prev) => prev.filter((s) => s.id !== id));
      setConfirmDelete(null);
      toast("Software gelöscht");
    } catch (err) {
      toast(err?.message || "Löschen fehlgeschlagen");
    }
  };

  const handleAssign = async (swId) => {
    if (!empId) return;
    try {
      await api.post(`/software/${swId}/assign/${empId}`);
      setSoftware((s) => s.map((sw) => sw.id === swId ? { ...sw, usedLicenses: (sw.usedLicenses || 0) + 1 } : sw));
      toast("Lizenz zugewiesen");
      setAssignDialog(null);
      setEmpId("");
    } catch (err) {
      toast(err?.message || "Zuweisung fehlgeschlagen");
    }
  };

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const [searchFocused, setSearchFocused] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => { setPage(0); }, [search, filterCat]);

  const filtered = software.filter((sw) => {
    const matchSearch = `${sw.name} ${sw.vendor || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "ALL" || sw.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) return <Spinner text="Software laden …" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Software oder Hersteller suchen …"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: "100%", padding: "10px 14px 10px 36px", borderRadius: "8px",
              border: `1px solid ${searchFocused ? "#6366f1" : "#334155"}`,
              fontSize: 13, outline: "none", background: "#0f172a", color: "#f1f5f9",
              fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
              boxShadow: searchFocused ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
              transition: "border-color 150ms ease, box-shadow 150ms ease",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["ALL", "PRODUCTIVITY", "DEV_TOOLS", "DESIGN", "OS"].map((c) => {
            const active = filterCat === c;
            const labels = { ALL: "Alle", PRODUCTIVITY: "Produktivität", DEV_TOOLS: "Entwicklung", DESIGN: "Design", OS: "Betriebssystem" };
            return (
              <button key={c} onClick={() => setFilterCat(c)} style={{
                padding: "7px 14px", borderRadius: "20px",
                border: `1px solid ${active ? "#6366f1" : "#334155"}`,
                background: active ? "rgba(99,102,241,0.12)" : "#1e293b",
                color: active ? "#a5b4fc" : "#64748b", fontSize: 12,
                fontWeight: active ? 600 : 400, fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer", transition: "all 150ms ease", whiteSpace: "nowrap",
              }}>{labels[c] || c}</button>
            );
          })}
        </div>
        <Btn variant="secondary" onClick={() => downloadPdf("/reports/licenses", "Lizenz-Audit.pdf").catch(() => toast("PDF fehlgeschlagen"))}>PDF</Btn>
        <Btn variant="secondary" onClick={() => setShowImport(true)}>CSV Import</Btn>
        <Btn variant="secondary" onClick={() => exportCSV(software, [
          { key: "name", label: "Name" }, { key: "vendor", label: "Hersteller" },
          { key: "version", label: "Version" }, { key: "category", label: "Kategorie" },
          { key: "licenseType", label: "Lizenztyp" }, { key: "totalLicenses", label: "Lizenzen gesamt" },
          { key: "usedLicenses", label: "Lizenzen genutzt" }, { key: "costPerLicense", label: "Kosten/Lizenz" },
          { key: "renewalDate", label: "Erneuerung" }, { key: "notes", label: "Notizen" },
        ], "Software")}>CSV Export</Btn>
        <Btn onClick={() => setShowForm(true)}>＋ Software</Btn>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {paged.map((sw) => {
          const pct      = Math.round((sw.usedLicenses / sw.totalLicenses) * 100);
          const low      = pct >= 85;
          const daysLeft = Math.ceil((new Date(sw.renewalDate) - new Date()) / (1000 * 86400));
          const isExpired = sw.renewalDate && new Date(sw.renewalDate) < new Date();
          const catEmoji = CAT_EMOJI[sw.category] || "💾";
          const catStyle = CAT_COLORS[sw.category] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
          const barColor = low ? "#f59e0b" : "#6366f1";

          return (
            <Card key={sw.id} p={20}>
              {/* Header */}
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "10px",
                    background: catStyle.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {catEmoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 16,
                          color: "#f1f5f9",
                          fontFamily: "'Sora', sans-serif",
                        }}
                      >
                        {sw.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          marginTop: 2,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {sw.vendor} · v{sw.version}
                      </div>
                    </div>
                    <Badge label={sw.vendor} color={catStyle.color} bg={catStyle.bg} sm />
                  </div>
                </div>
              </div>

              {/* License bar */}
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    marginBottom: 8,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>Lizenzen</span>
                  <span
                    style={{
                      color: low ? "#f59e0b" : "#94a3b8",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {sw.usedLicenses}/{sw.totalLicenses}
                  </span>
                </div>
                <div style={{ height: 8, background: "#334155", borderRadius: "4px" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: "4px",
                      background: barColor,
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  fontSize: 12,
                  color: "#475569",
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: low ? 12 : 0,
                }}
              >
                <span>{sw.costPerLicense?.toFixed(2)} €/Lizenz/Monat</span>
                <span>{(sw.totalLicenses * sw.costPerLicense * 12).toFixed(0)} €/Jahr</span>
                <span style={{ color: daysLeft < 60 ? "#ef4444" : "#475569" }}>
                  Erneuerung: {new Date(sw.renewalDate).toLocaleDateString("de-DE")}
                  {daysLeft > 0 ? ` (in ${daysLeft} Tagen)` : " ⚠️ abgelaufen"}
                </span>
              </div>

              {/* Notes */}
              {sw.notes && (
                <div style={{ fontSize: 12, color: "#6366f1", fontStyle: "italic", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}
                  title={sw.notes}>
                  {sw.notes.length > 60 ? sw.notes.substring(0, 60) + "…" : sw.notes}
                </div>
              )}

              {/* Warning banner */}
              {low && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "rgba(245,158,11,0.10)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: "6px",
                    fontSize: 12,
                    color: "#f59e0b",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  ⚠️ Lizenzkapazität fast erschöpft ({pct}%)
                </div>
              )}

              {/* Expired warning */}
              {isExpired && (
                <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", fontSize: 12, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>
                  Lizenz abgelaufen — keine neuen Zuweisungen möglich
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 6 }}>
                <Btn sm variant="secondary" onClick={() => setAssignDialog(sw)} disabled={isExpired || sw.usedLicenses >= sw.totalLicenses}>
                  Zuweisen
                </Btn>
                <Btn sm variant="secondary" onClick={() => { setEditSw(sw); setShowForm(true); }}>Bearbeiten</Btn>
                <Btn sm variant="danger" onClick={() => setConfirmDelete(sw)}>Löschen</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      {showForm && (
        <SoftwareFormModal
          software={editSw}
          onSave={(saved) => {
            setSoftware((prev) => {
              const exists = prev.find((s) => s.id === saved.id);
              return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
            });
            setShowForm(false);
            setEditSw(null);
            toast(editSw ? "Software gespeichert" : "Software angelegt");
          }}
          onClose={() => { setShowForm(false); setEditSw(null); }}
          toast={toast}
        />
      )}

      {confirmDelete && (
        <Modal title="Software löschen" onClose={() => setConfirmDelete(null)} width={420}>
          <p style={{ color: "#cbd5e1", fontSize: 14, fontFamily: "'DM Sans', sans-serif", margin: "0 0 20px" }}>
            Soll <strong style={{ color: "#f1f5f9" }}>{confirmDelete.name}</strong> wirklich gelöscht werden?
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>Abbrechen</Btn>
            <Btn variant="danger" onClick={() => handleDelete(confirmDelete.id)}>Löschen</Btn>
          </div>
        </Modal>
      )}

      {assignDialog && (
        <Modal
          title={`Lizenz zuweisen: ${assignDialog.name}`}
          onClose={() => { setAssignDialog(null); setEmpId(""); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                padding: "10px 14px",
                background: "#0f172a",
                borderRadius: "8px",
                border: "1px solid #334155",
                fontSize: 13,
                color: "#94a3b8",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Noch{" "}
              <strong style={{ color: "#f1f5f9" }}>
                {assignDialog.totalLicenses - assignDialog.usedLicenses}
              </strong>{" "}
              Lizenzen verfügbar.
            </div>
            <Select
              label="Mitarbeiter auswählen *"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              options={employees.filter((e) => e.active).map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
            />
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="ghost" onClick={() => { setAssignDialog(null); setEmpId(""); }}>Abbrechen</Btn>
            <Btn onClick={() => handleAssign(assignDialog.id)} disabled={!empId}>Zuweisen</Btn>
          </div>
        </Modal>
      )}

      {showImport && (
        <ImportDialog
          title="Software importieren"
          endpoint="software"
          onDone={() => { api.get("/software?size=200").then((d) => { if (d?.content) setSoftware(d.content); }); }}
          onClose={() => setShowImport(false)}
          toast={toast}
        />
      )}
    </div>
  );
}

export default SoftwarePage;
