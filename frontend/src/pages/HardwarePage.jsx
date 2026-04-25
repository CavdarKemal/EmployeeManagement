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
import { useAuth } from "../context/AuthContext.jsx";
import { canWriteHardware, canDeleteHardware, canLoanHardware, canImport } from "../utils/permissions.js";
import { useSortable, SortButton } from "../hooks/useSortable.jsx";

const FILTER_LABELS = {
  ALL:         "Alle",
  AVAILABLE:   "Verfügbar",
  LOANED:      "Ausgeliehen",
  MAINTENANCE: "Wartung",
  RETIRED:     "Ausgemustert",
};

// ── Loan Dialog (Unit-basiert) ──────────────────────────────────
function LoanDialog({ hardware, units, employees, onLoan, onReturn, onClose }) {
  const loanedUnits    = units.filter((u) => u.status === "LOANED");
  const availableUnits = units.filter((u) => u.status === "AVAILABLE");
  const hasLoaned    = loanedUnits.length > 0;
  const hasAvailable = availableUnits.length > 0;

  const [mode, setMode]           = useState(hasAvailable ? "loan" : "return");
  const [unitId, setUnitId]       = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);

  const handleAction = async () => {
    if (!unitId) return;
    setSaving(true);
    try {
      if (mode === "loan") await onLoan(Number(unitId), Number(employeeId), returnDate, notes);
      else                 await onReturn(Number(unitId), notes);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`${HW_EMOJI[hardware.category] || "🖥️"} ${hardware.name}`} onClose={onClose}>
      <div style={{
        marginBottom: 16, padding: "12px 14px", background: "#0f172a",
        borderRadius: 8, border: "1px solid #334155", fontSize: 13,
        color: "#94a3b8", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>
          {hardware.manufacturer} · {hardware.model}
        </div>
        Verfügbar: <strong style={{ color: "#34d399" }}>{availableUnits.length}</strong>
        {" · "}Ausgeliehen: <strong style={{ color: "#f59e0b" }}>{loanedUnits.length}</strong>
        {" · "}Gesamt: <strong style={{ color: "#f1f5f9" }}>{units.length}</strong>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {hasAvailable && (
          <Btn variant={mode === "loan" ? "primary" : "secondary"} onClick={() => { setMode("loan"); setUnitId(""); }}>
            📤 Ausleihen
          </Btn>
        )}
        {hasLoaned && (
          <Btn variant={mode === "return" ? "primary" : "secondary"} onClick={() => { setMode("return"); setUnitId(""); }}>
            📥 Zurückgeben
          </Btn>
        )}
      </div>

      {mode === "loan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Select
            label="Gerät *"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            options={availableUnits.map((u) => ({
              value: u.id,
              label: `${u.assetTag}${u.serialNumber ? " · SN " + u.serialNumber : ""}`,
            }))}
          />
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
          <Select
            label="Zurückzugebendes Gerät *"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            options={loanedUnits.map((u) => ({
              value: u.id,
              label: `${u.assetTag}${u.serialNumber ? " · SN " + u.serialNumber : ""}`,
            }))}
          />
          <Input label="Zustandsnotiz" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="z.B. Gerät in gutem Zustand …" />
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Abbrechen</Btn>
        <Btn onClick={handleAction} disabled={saving || !unitId || (mode === "loan" && !employeeId)}>
          {saving ? "…" : mode === "loan" ? "📤 Ausleihen" : "📥 Zurückgeben"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Hardware Form Modal (mit dynamischer Unit-Liste) ───────────
function HardwareFormModal({ hardware, onSave, onClose, toast }) {
  const isEdit = Boolean(hardware?.id);
  const initial = hardware ?? { name: "", category: "LAPTOP", manufacturer: "", model: "", notes: "" };
  const emptyUnit = { serialNumber: "" };
  const [form, setForm] = useState(initial);
  const [newUnits, setNewUnits] = useState(isEdit ? [] : [{ ...emptyUnit }]);
  const [commonPurchaseDate, setCommonPurchaseDate] = useState("");
  const [commonWarrantyUntil, setCommonWarrantyUntil] = useState("");
  const [existingUnits, setExistingUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoadingUnits(true);
    api.get(`/hardware/${form.id}/units`)
      .then((d) => setExistingUnits(d || []))
      .catch(() => toast?.("Geräte konnten nicht geladen werden"))
      .finally(() => setLoadingUnits(false));
  }, [isEdit, form.id]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const setNewUnit = (idx, k, v) =>
    setNewUnits((u) => u.map((x, i) => (i === idx ? { ...x, [k]: v } : x)));

  const addNewUnit = () => setNewUnits((u) => [...u, { ...emptyUnit }]);

  const removeNewUnit = (idx) =>
    setNewUnits((u) => (isEdit || u.length > 1 ? u.filter((_, i) => i !== idx) : u));

  const deleteExistingUnit = async (id) => {
    if (!window.confirm("Gerät wirklich löschen?")) return;
    try {
      await api.delete(`/hardware/units/${id}`);
      setExistingUnits((u) => u.filter((x) => x.id !== id));
      toast?.("Gerät gelöscht");
    } catch (err) {
      toast?.(err?.message || "Löschen fehlgeschlagen");
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name) e.name = "Pflichtfeld";
    if (!isEdit && !newUnits.length) e.units = "Mindestens ein Gerät erforderlich";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const unitPayload = (u) => ({
    serialNumber: u.serialNumber || null,
    purchaseDate: commonPurchaseDate || null,
    warrantyUntil: commonWarrantyUntil || null,
    purchasePrice: null,
    status: "AVAILABLE",
  });

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const meta = {
        name: form.name,
        category: form.category,
        manufacturer: form.manufacturer,
        model: form.model,
        notes: form.notes,
      };
      let result;
      if (isEdit) {
        await api.put(`/hardware/${form.id}`, meta);
        for (const u of newUnits) {
          await api.post(`/hardware/${form.id}/units`, unitPayload(u));
        }
        result = await api.get(`/hardware/${form.id}`);
      } else {
        result = await api.post("/hardware", { ...meta, units: newUnits.map(unitPayload) });
      }
      onSave(result);
    } catch (err) {
      toast?.(err?.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Hardware bearbeiten" : "Neue Hardware"} onClose={onClose} width={760}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} required error={errors.name} placeholder='MacBook Pro 16"' />
        <Select label="Kategorie" value={form.category} onChange={(e) => set("category", e.target.value)} options={["LAPTOP", "MONITOR", "TABLET", "PHONE", "DESKTOP", "ACCESSORY"]} />
        <Input label="Hersteller" value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="Apple" />
        <Input label="Modell" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="MK183D/A" />
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>Notizen</label>
          <textarea
            value={form.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Interne Bemerkungen …"
            rows={2}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155", fontSize: 13, color: "#f1f5f9", background: "#0f172a", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", resize: "vertical" }}
          />
        </div>
      </div>

      {isEdit && (
        <div style={{ marginTop: 22 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
              Vorhandene Geräte ({existingUnits.length})
            </span>
          </div>
          {loadingUnits ? (
            <div style={{ padding: 12, color: "#64748b", fontSize: 12 }}>Lade Geräte …</div>
          ) : existingUnits.length === 0 ? (
            <div style={{ padding: 12, background: "#0f172a", borderRadius: 8, border: "1px solid #334155", color: "#64748b", fontSize: 12 }}>
              Keine Geräte vorhanden
            </div>
          ) : (
            <div style={{ background: "#0f172a", borderRadius: 8, border: "1px solid #334155", overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Asset-Tag</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Seriennummer</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Garantie</th>
                    <th style={{ padding: "8px 10px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {existingUnits.map((u) => {
                    const st = STATUS[u.status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", label: u.status };
                    return (
                      <tr key={u.id} style={{ borderTop: "1px solid #334155", color: "#f1f5f9" }}>
                        <td style={{ padding: "8px 10px" }}>
                          <code style={{ color: "#a5b4fc", fontFamily: "'JetBrains Mono', monospace" }}>{u.assetTag}</code>
                        </td>
                        <td style={{ padding: "8px 10px" }}>{u.serialNumber || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <Badge label={st.label} color={st.color} bg={st.bg} sm />
                        </td>
                        <td style={{ padding: "8px 10px", color: "#94a3b8" }}>
                          {u.warrantyUntil ? new Date(u.warrantyUntil).toLocaleDateString("de-DE") : "—"}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right" }}>
                          <button
                            onClick={() => deleteExistingUnit(u.id)}
                            disabled={u.status === "LOANED"}
                            title={u.status === "LOANED" ? "Ausgeliehenes Gerät kann nicht gelöscht werden" : "Entfernen"}
                            style={{
                              padding: "4px 8px",
                              background: "transparent",
                              border: "1px solid #334155",
                              borderRadius: 6,
                              color: u.status === "LOANED" ? "#334155" : "#ef4444",
                              cursor: u.status === "LOANED" ? "not-allowed" : "pointer",
                              fontSize: 14,
                            }}
                          >×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
            {isEdit ? `Neue Geräte (${newUnits.length})` : `Geräte (${newUnits.length})`}
          </span>
          <Btn sm variant="secondary" onClick={addNewUnit}>+ Seriennummer hinzufügen</Btn>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          padding: 10,
          marginBottom: 10,
          background: "#0f172a",
          borderRadius: 8,
          border: "1px solid #334155",
        }}>
          <Input label="Kaufdatum (für alle neuen Geräte)" type="date"
                 value={commonPurchaseDate}
                 onChange={(e) => setCommonPurchaseDate(e.target.value)} />
          <Input label="Garantie bis (für alle neuen Geräte)" type="date"
                 value={commonWarrantyUntil}
                 onChange={(e) => setCommonWarrantyUntil(e.target.value)} />
        </div>

        {newUnits.length === 0 ? (
          <div style={{ padding: 12, background: "#0f172a", borderRadius: 8, border: "1px dashed #334155", color: "#64748b", fontSize: 12 }}>
            Keine neuen Geräte — klicke „+ Seriennummer hinzufügen", um welche anzulegen.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {newUnits.map((u, i) => {
              const removable = isEdit || newUnits.length > 1;
              return (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 8,
                  padding: 10,
                  background: "#0f172a",
                  borderRadius: 8,
                  border: "1px solid #334155",
                }}>
                  <Input label={`Seriennummer ${i + 1}`} value={u.serialNumber}
                         onChange={(e) => setNewUnit(i, "serialNumber", e.target.value)}
                         placeholder={`Gerät ${i + 1}`} />
                  <button
                    onClick={() => removeNewUnit(i)}
                    disabled={!removable}
                    title={removable ? "Entfernen" : "Mindestens 1 Gerät erforderlich"}
                    style={{
                      alignSelf: "end",
                      padding: "8px 10px",
                      background: "transparent",
                      border: "1px solid #334155",
                      borderRadius: 6,
                      color: removable ? "#ef4444" : "#334155",
                      cursor: removable ? "pointer" : "not-allowed",
                      fontSize: 16,
                    }}
                  >×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Abbrechen</Btn>
        <Btn onClick={handleSave} disabled={saving}>{saving ? "Speichern …" : "Speichern"}</Btn>
      </div>
    </Modal>
  );
}

// ── Unit Management Modal ──────────────────────────────────────
function UnitManagementModal({ hardware, onClose, toast }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newUnit, setNewUnit] = useState({ serialNumber: "", purchaseDate: "", warrantyUntil: "", purchasePrice: "" });

  const reload = () => {
    setLoading(true);
    api.get(`/hardware/${hardware.id}/units`)
      .then((d) => setUnits(d || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [hardware.id]);

  const addUnit = async () => {
    try {
      await api.post(`/hardware/${hardware.id}/units`, {
        serialNumber: newUnit.serialNumber || null,
        purchaseDate: newUnit.purchaseDate || null,
        warrantyUntil: newUnit.warrantyUntil || null,
        purchasePrice: newUnit.purchasePrice ? Number(newUnit.purchasePrice) : null,
        status: "AVAILABLE",
      });
      setAdding(false);
      setNewUnit({ serialNumber: "", purchaseDate: "", warrantyUntil: "", purchasePrice: "" });
      reload();
      toast?.("Gerät hinzugefügt");
    } catch (err) { toast?.(err?.message || "Anlegen fehlgeschlagen"); }
  };

  const deleteUnit = async (id) => {
    if (!window.confirm("Gerät wirklich löschen?")) return;
    try { await api.delete(`/hardware/units/${id}`); reload(); toast?.("Gerät gelöscht"); }
    catch (err) { toast?.(err?.message || "Löschen fehlgeschlagen"); }
  };

  return (
    <Modal title={`Geräte: ${hardware.name}`} onClose={onClose} width={820}>
      {loading ? <Spinner /> : (
        <>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155", color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>
                <th style={{ padding: 10, textAlign: "left" }}>Asset-Tag</th>
                <th style={{ padding: 10, textAlign: "left" }}>Seriennummer</th>
                <th style={{ padding: 10, textAlign: "left" }}>Status</th>
                <th style={{ padding: 10, textAlign: "left" }}>Garantie</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => {
                const st = STATUS[u.status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", label: u.status };
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #334155", color: "#f1f5f9" }}>
                    <td style={{ padding: 10 }}>
                      <code style={{ color: "#a5b4fc", fontFamily: "'JetBrains Mono', monospace" }}>{u.assetTag}</code>
                    </td>
                    <td style={{ padding: 10 }}>{u.serialNumber || "—"}</td>
                    <td style={{ padding: 10 }}><Badge label={st.label} color={st.color} bg={st.bg} sm /></td>
                    <td style={{ padding: 10 }}>{u.warrantyUntil ? new Date(u.warrantyUntil).toLocaleDateString("de-DE") : "—"}</td>
                    <td style={{ padding: 10, textAlign: "right" }}>
                      <Btn sm variant="danger" disabled={u.status === "LOANED"} onClick={() => deleteUnit(u.id)}>Löschen</Btn>
                    </td>
                  </tr>
                );
              })}
              {units.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>Keine Geräte vorhanden</td></tr>
              )}
            </tbody>
          </table>

          {!adding && (
            <div style={{ marginTop: 14 }}>
              <Btn variant="secondary" onClick={() => setAdding(true)}>+ Gerät hinzufügen</Btn>
            </div>
          )}
          {adding && (
            <div style={{ marginTop: 14, padding: 12, background: "#0f172a", borderRadius: 8, border: "1px solid #334155" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
                <Input label="Seriennummer" value={newUnit.serialNumber} onChange={(e) => setNewUnit({ ...newUnit, serialNumber: e.target.value })} />
                <Input label="Kaufdatum" type="date" value={newUnit.purchaseDate} onChange={(e) => setNewUnit({ ...newUnit, purchaseDate: e.target.value })} />
                <Input label="Garantie bis" type="date" value={newUnit.warrantyUntil} onChange={(e) => setNewUnit({ ...newUnit, warrantyUntil: e.target.value })} />
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Btn variant="ghost" onClick={() => setAdding(false)}>Abbrechen</Btn>
                <Btn onClick={addUnit}>Anlegen</Btn>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

// ── Hardware Page ────────────────────────────────────────────
function HardwarePage({ toast }) {
  const { user } = useAuth();
  const mayWrite  = canWriteHardware(user);
  const mayDelete = canDeleteHardware(user);
  const mayLoan   = canLoanHardware(user);
  const mayImport = canImport(user);
  const [hardware, setHardware] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("ALL");
  const [loanDialogHw, setLoanDialogHw]   = useState(null);
  const [loanDialogUnits, setLoanDialogUnits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editHw, setEditHw] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [unitsDialog, setUnitsDialog] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const reloadHardware = () =>
    api.get("/hardware?size=200").then((data) => { if (data?.content) setHardware(data.content); });

  useEffect(() => {
    Promise.all([
      reloadHardware(),
      api.get("/employees?size=200").then((data) => { if (data?.content) setEmployees(data.content); }),
    ]).catch(() => toast?.("Hardware konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(0); }, [search, filter]);

  const statusFor = (hw) => {
    if (hw.availableQuantity > 0) return "AVAILABLE";
    if (hw.totalQuantity > 0) return "LOANED";
    return "RETIRED";
  };

  const filtered = hardware.filter((h) => {
    const matchSearch = `${h.name} ${h.manufacturer} ${h.model}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || statusFor(h) === filter;
    return matchSearch && matchFilter;
  });

  const { sortedData, sortConfig, requestSort } = useSortable(filtered, { key: "name", direction: "asc" });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paged = sortedData.slice(page * pageSize, (page + 1) * pageSize);

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

  const openLoanDialog = async (hw) => {
    try {
      const units = await api.get(`/hardware/${hw.id}/units`);
      setLoanDialogUnits(units || []);
      setLoanDialogHw(hw);
    } catch {
      toast?.("Geräte konnten nicht geladen werden");
    }
  };

  const handleLoan = async (unitId, empId, returnDate, notes) => {
    try {
      await api.post(`/loans/hardware-unit/${unitId}/loan`, {
        employeeId: empId,
        returnDate: returnDate || null,
        notes: notes || null,
      });
      await reloadHardware();
      toast("Gerät erfolgreich ausgeliehen");
    } catch (err) {
      toast(err?.message || "Ausleihe fehlgeschlagen");
    }
  };

  const handleReturn = async (unitId, notes) => {
    try {
      await api.post(`/loans/hardware-unit/${unitId}/return`, { notes: notes || null });
      await reloadHardware();
      toast("Gerät zurückgenommen");
    } catch (err) {
      toast(err?.message || "Rückgabe fehlgeschlagen");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      {loading && <Spinner text="Hardware laden …" />}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
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

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["ALL", "AVAILABLE", "LOANED"].map((s) => {
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
        {mayImport && <Btn variant="secondary" onClick={() => setShowImport(true)}>CSV Import</Btn>}
        <Btn variant="secondary" onClick={() => exportCSV(hardware, [
          { key: "name", label: "Name" }, { key: "category", label: "Kategorie" },
          { key: "manufacturer", label: "Hersteller" }, { key: "model", label: "Modell" },
          { key: "totalQuantity", label: "Gesamt" }, { key: "availableQuantity", label: "Verfügbar" },
          { key: "notes", label: "Notizen" },
        ], "Hardware")}>CSV Export</Btn>
        {mayWrite && <Btn onClick={() => setShowForm(true)}>＋ Hardware</Btn>}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Sans', sans-serif", marginRight: 4 }}>Sortieren:</span>
        <SortButton label="Name" sortKey="name" sortConfig={sortConfig} onSort={requestSort} />
        <SortButton label="Kategorie" sortKey="category" sortConfig={sortConfig} onSort={requestSort} />
        <SortButton label="Hersteller" sortKey="manufacturer" sortConfig={sortConfig} onSort={requestSort} />
        <SortButton label="Verfügbar" sortKey="availableQuantity" sortConfig={sortConfig} onSort={requestSort} />
        <SortButton label="Gesamt" sortKey="totalQuantity" sortConfig={sortConfig} onSort={requestSort} />
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <div style={{
        flex: 1, overflowY: "auto", background: "#1e293b",
        borderRadius: "12px", border: "1px solid #334155", overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0f172a" }}>
              {["", "Bestand", "Modell", "Kategorie", "Hersteller · Modell", ""].map((h, i) => (
                <th key={i} style={{
                  padding: "12px 14px", textAlign: "left", fontSize: 11,
                  fontWeight: 600, color: "#64748b", textTransform: "uppercase",
                  letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif",
                  borderBottom: "1px solid #334155", whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((hw, idx) => {
              const total     = hw.totalQuantity ?? 0;
              const available = hw.availableQuantity ?? 0;
              return (
                <tr
                  key={hw.id}
                  style={{
                    fontSize: 13,
                    borderBottom: idx < paged.length - 1 ? "1px solid #334155" : "none",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 14px", fontSize: 20, lineHeight: 1 }}>
                    {HW_EMOJI[hw.category] || "🖥️"}
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14, fontWeight: 600,
                      color: available > 0 ? "#34d399" : "#f59e0b",
                    }}>
                      {available} / {total}
                    </span>
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <div style={{ fontWeight: 500, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
                      {hw.name}
                    </div>
                    {hw.notes && (
                      <div style={{ fontSize: 11, color: "#6366f1", marginTop: 3, fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }} title={hw.notes}>
                        {hw.notes.length > 40 ? hw.notes.substring(0, 40) + "…" : hw.notes}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <Badge label={hw.category} color="#94a3b8" bg="rgba(148,163,184,0.1)" sm />
                  </td>
                  <td style={{ padding: "14px 14px", fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
                    {hw.manufacturer || "—"} · {hw.model || "—"}
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {mayLoan && total > 0 && (
                        <Btn sm variant="secondary" onClick={() => openLoanDialog(hw)}>
                          Ausleihe
                        </Btn>
                      )}
                      {mayWrite && <Btn sm variant="secondary" onClick={() => setUnitsDialog(hw)}>Geräte</Btn>}
                      {mayWrite && <Btn sm variant="secondary" onClick={() => { setEditHw(hw); setShowForm(true); }}>Bearbeiten</Btn>}
                      {mayDelete && <Btn sm variant="danger" onClick={() => setConfirmDelete(hw)}>Löschen</Btn>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      {loanDialogHw && (
        <LoanDialog
          hardware={loanDialogHw}
          units={loanDialogUnits}
          employees={employees}
          onLoan={handleLoan}
          onReturn={handleReturn}
          onClose={() => { setLoanDialogHw(null); setLoanDialogUnits([]); }}
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
            Soll <strong style={{ color: "#f1f5f9" }}>{confirmDelete.name}</strong> (inkl. aller {confirmDelete.totalQuantity ?? 0} Geräte) wirklich gelöscht werden?
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
          onDone={() => reloadHardware()}
          onClose={() => setShowImport(false)}
          toast={toast}
        />
      )}

      {unitsDialog && (
        <UnitManagementModal
          hardware={unitsDialog}
          toast={toast}
          onClose={() => { setUnitsDialog(null); reloadHardware(); }}
        />
      )}
    </div>
  );
}

export default HardwarePage;
