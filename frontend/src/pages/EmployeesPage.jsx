import { useState, useEffect } from "react";
import api from "../api/index.js";
import { T, DEPT } from "../components/tokens.js";
import Avatar from "../components/Avatar.jsx";
import Badge from "../components/Badge.jsx";
import Btn from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";
import Spinner from "../components/Spinner.jsx";
import { exportCSV } from "../utils/csvExport.js";
import { downloadPdf } from "../utils/pdfDownload.js";
import Pagination from "../components/Pagination.jsx";
import ImportDialog from "../components/ImportDialog.jsx";


// ── Employee Form Modal ──────────────────────────────────────
function EmployeeFormModal({ employee, onSave, onClose, toast }) {
  const initial = employee ?? {
    employeeNumber: "", firstName: "", lastName: "", email: "",
    phone: "", position: "", department: "", hireDate: "", salary: "", active: true,
    street: "", city: "", zipCode: "", country: "Deutschland",
  };
  const [form, setForm]     = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto]   = useState(null);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.firstName)      e.firstName      = "Pflichtfeld";
    if (!form.lastName)       e.lastName       = "Pflichtfeld";
    if (!form.employeeNumber) e.employeeNumber  = "Pflichtfeld";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Gültige E-Mail erforderlich";
    if (!form.hireDate)       e.hireDate       = "Pflichtfeld";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, salary: Number(form.salary) };
      const formData = new FormData();
      formData.append("employee", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      if (photo) formData.append("photo", photo);
      let result;
      if (form.id) {
        result = await api.putForm(`/employees/${form.id}`, formData);
      } else {
        result = await api.postForm("/employees", formData);
      }
      onSave(result);
    } catch (err) {
      const msg = err?.message || err?.error || "Speichern fehlgeschlagen";
      toast?.(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={employee ? "Mitarbeiter bearbeiten" : "Neuer Mitarbeiter"} onClose={onClose} width={600}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input label="Mitarbeiter-Nr."   value={form.employeeNumber} onChange={(e) => set("employeeNumber", e.target.value)} required error={errors.employeeNumber} placeholder="EMP-001" />
        <Input label="Einstellungsdatum" type="date" value={form.hireDate} onChange={(e) => set("hireDate", e.target.value)} required error={errors.hireDate} />
        <Input label="Vorname"  value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required error={errors.firstName} />
        <Input label="Nachname" value={form.lastName}  onChange={(e) => set("lastName",  e.target.value)} required error={errors.lastName} />
        <Input label="E-Mail"   type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required error={errors.email} />
        <Input label="Telefon"  value={form.phone}     onChange={(e) => set("phone",    e.target.value)} placeholder="+49 30 …" />
        <Input label="Position" value={form.position}  onChange={(e) => set("position", e.target.value)} />
        <Select
          label="Abteilung"
          value={form.department}
          onChange={(e) => set("department", e.target.value)}
          options={["Engineering", "Product", "Design", "Human Resources", "Marketing", "Finance", "IT"]}
        />
        <Input label="Gehalt (€/Jahr)" type="number" value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="75000" />
        <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #334155", marginTop: 4, paddingTop: 10 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>Adresse</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Straße" value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="Musterstraße 1" />
            <Input label="PLZ" value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} placeholder="10115" />
            <Input label="Stadt" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Berlin" />
            <Input label="Land" value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Deutschland" />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10 }}>
          <input
            type="checkbox"
            id="active"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
            style={{ accentColor: "#6366f1" }}
          />
          <label htmlFor="active" style={{ fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
            Aktiv
          </label>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 14 }}>
        {form.photoUrl && !photo && (
          <img src={form.photoUrl} alt="Aktuelles Foto" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
        )}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>
            {form.photoUrl ? "Foto ändern (optional)" : "Foto (optional, max. 5 MB)"}
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => setPhoto(e.target.files[0] || null)}
            style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}
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

// ── Employees Page ───────────────────────────────────────────
function EmployeesPage({ toast }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/employees?size=200").then((data) => {
      if (data?.content) setEmployees(data.content);
    }).catch((err) => {
      toast?.("Mitarbeiter konnten nicht geladen werden");
      console.error("GET /employees failed:", err);
    }).finally(() => setLoading(false));
  }, []);
  const [selected, setSelected]   = useState(null);
  const [checked, setChecked]     = useState(new Set());
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editEmp, setEditEmp]     = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [empLoans, setEmpLoans]   = useState([]);
  const [empLoanHistory, setEmpLoanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [empSoftware, setEmpSoftware] = useState([]);
  const [assignHardware, setAssignHardware] = useState(false);
  const [assignSoftware, setAssignSoftware] = useState(false);

  useEffect(() => {
    if (!selected) { setEmpLoans([]); setEmpLoanHistory([]); setEmpSoftware([]); setShowHistory(false); return; }
    api.get(`/loans/employees/${selected}/active`).then(setEmpLoans).catch(() => setEmpLoans([]));
    api.get(`/loans/employees/${selected}/history`).then(setEmpLoanHistory).catch(() => setEmpLoanHistory([]));
    api.get(`/software/employees/${selected}/active`).then(setEmpSoftware).catch(() => setEmpSoftware([]));
  }, [selected]);

  const filtered = employees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.department} ${e.position}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const emp = employees.find((e) => e.id === selected);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      if (selected === id) setSelected(null);
      setConfirmDelete(null);
      toast("Mitarbeiter gelöscht");
    } catch {
      toast("Löschen fehlgeschlagen");
    }
  };

  const handleSave = (saved) => {
    setEmployees((prev) => {
      const exists = prev.find((e) => e.id === saved.id);
      return exists ? prev.map((e) => (e.id === saved.id ? saved : e)) : [...prev, saved];
    });
    setShowForm(false);
    setEditEmp(null);
    toast(saved.id ? "Mitarbeiter gespeichert ✅" : "Mitarbeiter angelegt ✅");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      {/* Batch actions */}
      {checked.size > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px" }}>
          <span style={{ fontSize: 13, color: "#a5b4fc", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{checked.size} ausgewählt</span>
          <Btn sm variant="danger" onClick={async () => {
            try {
              await api.post("/batch/employees/deactivate", [...checked]);
              setEmployees((prev) => prev.filter((e) => !checked.has(e.id)));
              toast(`${checked.size} Mitarbeiter deaktiviert`);
              setChecked(new Set());
            } catch { toast("Batch-Aktion fehlgeschlagen"); }
          }}>Deaktivieren</Btn>
          <Btn sm variant="ghost" onClick={() => setChecked(new Set())}>Auswahl aufheben</Btn>
        </div>
      )}
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
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
            placeholder="Name, Nummer, Abteilung suchen …"
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
        <Btn variant="secondary" onClick={() => downloadPdf("/reports/employees", "Mitarbeiter-Bericht.pdf").catch(() => toast("PDF-Download fehlgeschlagen"))}>PDF</Btn>
        <Btn variant="secondary" onClick={() => setShowImport(true)}>CSV Import</Btn>
        <Btn variant="secondary" onClick={() => exportCSV(employees, [
          { key: "employeeNumber", label: "Nr." }, { key: "firstName", label: "Vorname" },
          { key: "lastName", label: "Nachname" }, { key: "email", label: "E-Mail" },
          { key: "phone", label: "Telefon" }, { key: "position", label: "Position" },
          { key: "department", label: "Abteilung" }, { key: "hireDate", label: "Eingestellt" },
          { key: "salary", label: "Gehalt" }, { key: "street", label: "Straße" },
          { key: "zipCode", label: "PLZ" }, { key: "city", label: "Stadt" },
          { key: "country", label: "Land" },
        ], "Mitarbeiter")}>CSV Export</Btn>
        <Btn onClick={() => { setEditEmp(null); setShowForm(true); }}>＋ Mitarbeiter</Btn>
      </div>

      {loading && <Spinner text="Mitarbeiter laden …" />}
      <div style={{ display: loading ? "none" : "flex", gap: 0, flex: 1, minHeight: 0, background: "#1e293b", borderRadius: "12px", border: "1px solid #334155", overflow: "hidden" }}>
        {/* Master List */}
        <div
          style={{
            width: 380,
            flexShrink: 0,
            overflowY: "auto",
            borderRight: "1px solid #1e293b",
          }}
        >
          {filtered.map((e, idx) => {
            const isActive = selected === e.id;
            const deptColor = DEPT[e.department] || "#6366f1";
            return (
              <div
                key={e.id}
                onClick={() => setSelected(e.id)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "background 150ms ease",
                  background: isActive ? "rgba(99,102,241,0.10)" : "transparent",
                  borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
                  borderBottom: idx < filtered.length - 1 ? "1px solid #1e293b" : "none",
                }}
                onMouseEnter={(el) => { if (!isActive) el.currentTarget.style.background = "rgba(51,65,85,0.5)"; }}
                onMouseLeave={(el) => { if (!isActive) el.currentTarget.style.background = "transparent"; }}
              >
                <input type="checkbox" checked={checked.has(e.id)}
                  onChange={(ev) => { ev.stopPropagation(); setChecked((prev) => { const n = new Set(prev); n.has(e.id) ? n.delete(e.id) : n.add(e.id); return n; }); }}
                  onClick={(ev) => ev.stopPropagation()}
                  style={{ accentColor: "#6366f1", flexShrink: 0 }}
                />
                {e.photoUrl ? (
                  <img src={e.photoUrl} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <Avatar name={`${e.firstName} ${e.lastName}`} size={38} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
                      {e.firstName} {e.lastName}
                    </span>
                    {!e.active && (
                      <Badge label="Inaktiv" color="#ef4444" bg="rgba(239,68,68,0.12)" sm />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      marginTop: 2,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {e.employeeNumber}
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <Badge
                      label={e.department}
                      color={deptColor}
                      bg={deptColor + "22"}
                      sm
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflowY: "auto", background: "#0f172a" }}>
          {!emp ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
                color: "#334155",
              }}
            >
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="20" r="10" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                <path d="M8 48c0-11.046 8.954-20 20-20s20 8.954 20 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
              <div style={{ fontSize: 14, color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>
                Mitarbeiter auswählen
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Header card */}
              <div
                style={{
                  padding: "24px 28px",
                  borderBottom: "1px solid #1e293b",
                  background: "#0f172a",
                }}
              >
                <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                  {emp.photoUrl ? (
                    <img
                      src={emp.photoUrl}
                      alt={`${emp.firstName} ${emp.lastName}`}
                      style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <Avatar name={`${emp.firstName} ${emp.lastName}`} size={60} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 20,
                          fontWeight: 600,
                          color: "#f1f5f9",
                          fontFamily: "'Sora', sans-serif",
                        }}
                      >
                        {emp.firstName} {emp.lastName}
                      </h2>
                      <Badge
                        label={emp.active ? "Aktiv" : "Inaktiv"}
                        color={emp.active ? "#10b981" : "#ef4444"}
                        bg={emp.active ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}
                      />
                    </div>
                    <div
                      style={{
                        color: "#a5b4fc",
                        fontWeight: 500,
                        marginTop: 4,
                        fontSize: 14,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {emp.position}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <Badge
                        label={emp.department}
                        color={DEPT[emp.department] || "#94a3b8"}
                        bg={(DEPT[emp.department] || "#94a3b8") + "22"}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: "#475569",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {emp.employeeNumber}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn sm variant="secondary" onClick={() => { setEditEmp(emp); setShowForm(true); }}>
                      Bearbeiten
                    </Btn>
                    <Btn sm variant="danger" onClick={() => setConfirmDelete(emp)}>
                      Löschen
                    </Btn>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div
                style={{
                  padding: "20px 28px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                }}
              >
                {[
                  { label: "E-MAIL",      value: emp.email },
                  { label: "TELEFON",     value: emp.phone || "—" },
                  { label: "EINGESTELLT", value: new Date(emp.hireDate).toLocaleDateString("de-DE") },
                  { label: "GEHALT",      value: `${emp.salary?.toLocaleString("de-DE")} €/Jahr` },
                  { label: "ADRESSE",     value: [emp.street, `${emp.zipCode || ""} ${emp.city || ""}`.trim(), emp.country].filter(Boolean).join(", ") || "—" },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontFamily: "'DM Sans', sans-serif",
                        marginBottom: 4,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#f1f5f9",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}

                {/* Hardware section */}
                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #1e293b", paddingTop: 16, marginTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
                      ZUGEWIESENE HARDWARE
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setAssignHardware(true)} style={{
                        background: "#6366f1", border: "none", borderRadius: "6px", padding: "4px 12px",
                        fontSize: 11, color: "#fff", cursor: "pointer", fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif", transition: "background 150ms ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#4f46e5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#6366f1")}
                      >
                        + Neue Hardware
                      </button>
                      {empLoanHistory.length > 0 && (
                        <button onClick={() => setShowHistory((h) => !h)} style={{
                          background: "none", border: "1px solid #334155", borderRadius: "6px", padding: "3px 10px",
                          fontSize: 11, color: showHistory ? "#a5b4fc" : "#64748b", cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif", transition: "all 150ms ease",
                        }}>
                          {showHistory ? "Aktive anzeigen" : `Historie (${empLoanHistory.filter((l) => l.returnedAt).length})`}
                        </button>
                      )}
                    </div>
                  </div>

                  {!showHistory ? (
                    empLoans.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#334155", fontFamily: "'DM Sans', sans-serif" }}>Keine Hardware zugewiesen</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {empLoans.map((l) => (
                          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>{l.hardwareName}</div>
                              <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{l.assetTag}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>
                                seit {new Date(l.loanDate).toLocaleDateString("de-DE")}
                              </span>
                              <Btn sm variant="secondary" onClick={async () => {
                                try {
                                  await api.post(`/loans/hardware/${l.hardwareId}/return`);
                                  setEmpLoans((prev) => prev.filter((x) => x.id !== l.id));
                                  toast("Hardware zurückgegeben");
                                } catch (err) { toast(err?.message || "Rückgabe fehlgeschlagen"); }
                              }}>Zurückgeben</Btn>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    empLoanHistory.filter((l) => l.returnedAt).length === 0 ? (
                      <div style={{ fontSize: 13, color: "#334155", fontFamily: "'DM Sans', sans-serif" }}>Keine abgeschlossenen Ausleihen</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {empLoanHistory.filter((l) => l.returnedAt).map((l) => (
                          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#0f172a", borderRadius: "8px", border: "1px solid #1e293b", opacity: 0.7 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>{l.hardwareName}</div>
                              <div style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{l.assetTag}</div>
                            </div>
                            <div style={{ fontSize: 11, color: "#475569", fontFamily: "'DM Sans', sans-serif", textAlign: "right" }}>
                              <div>{new Date(l.loanDate).toLocaleDateString("de-DE")} — {new Date(l.returnedAt).toLocaleDateString("de-DE")}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>

                {/* Software section */}
                <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
                      SOFTWARE & LIZENZEN
                    </div>
                    <button onClick={() => setAssignSoftware(true)} style={{
                      background: "#6366f1", border: "none", borderRadius: "6px", padding: "4px 12px",
                      fontSize: 11, color: "#fff", cursor: "pointer", fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif", transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#4f46e5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#6366f1")}
                    >
                      + Neue Software
                    </button>
                  </div>
                  {empSoftware.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#334155", fontFamily: "'DM Sans', sans-serif" }}>Keine Software zugewiesen</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {empSoftware.map((a) => {
                        const isExpired = a.expired || (a.renewalDate && new Date(a.renewalDate) < new Date());
                        return (
                          <div key={a.id} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 12px", borderRadius: "8px",
                            background: isExpired ? "rgba(239,68,68,0.05)" : "#1e293b",
                            border: `1px solid ${isExpired ? "rgba(239,68,68,0.3)" : "#334155"}`,
                            opacity: isExpired ? 0.7 : 1,
                          }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: isExpired ? "#94a3b8" : "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>{a.softwareName}</span>
                                {isExpired && <Badge label="Deaktiviert" color="#ef4444" bg="rgba(239,68,68,0.12)" sm />}
                              </div>
                              <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{a.vendor}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>
                                seit {new Date(a.assignedDate).toLocaleDateString("de-DE")}
                              </span>
                              {!isExpired && (
                                <Btn sm variant="secondary" onClick={async () => {
                                  try {
                                    await api.post(`/software/${a.softwareId}/revoke/${selected}`);
                                    setEmpSoftware((prev) => prev.filter((x) => x.id !== a.id));
                                    toast("Lizenz entzogen");
                                  } catch (err) { toast(err?.message || "Entzug fehlgeschlagen"); }
                                }}>Entziehen</Btn>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <EmployeeFormModal
          employee={editEmp}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditEmp(null); }}
          toast={toast}
        />
      )}

      {confirmDelete && (
        <Modal title="Mitarbeiter löschen" onClose={() => setConfirmDelete(null)} width={420}>
          <p style={{ color: "#cbd5e1", fontSize: 14, fontFamily: "'DM Sans', sans-serif", margin: "0 0 20px" }}>
            Soll <strong style={{ color: "#f1f5f9" }}>{confirmDelete.firstName} {confirmDelete.lastName}</strong> wirklich gelöscht werden?
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>Abbrechen</Btn>
            <Btn variant="danger" onClick={() => handleDelete(confirmDelete.id)}>Löschen</Btn>
          </div>
        </Modal>
      )}

      {showImport && (
        <ImportDialog
          title="Mitarbeiter importieren"
          endpoint="employees"
          onDone={() => { api.get("/employees?size=200").then((d) => { if (d?.content) setEmployees(d.content); }); }}
          onClose={() => setShowImport(false)}
          toast={toast}
        />
      )}

      {assignHardware && emp && (
        <AssignHardwareModal
          employee={emp}
          onClose={() => setAssignHardware(false)}
          onAssigned={() => {
            api.get(`/loans/employees/${selected}/active`).then(setEmpLoans).catch(() => {});
            setAssignHardware(false);
            toast("Hardware zugewiesen");
          }}
          toast={toast}
        />
      )}

      {assignSoftware && emp && (
        <AssignSoftwareModal
          employee={emp}
          onClose={() => setAssignSoftware(false)}
          onAssigned={() => {
            api.get(`/software/employees/${selected}/active`).then(setEmpSoftware).catch(() => {});
            setAssignSoftware(false);
            toast("Software zugewiesen");
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

function AssignHardwareModal({ employee, onClose, onAssigned, toast }) {
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [busyId, setBusyId]     = useState(null);
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  useEffect(() => {
    api.get("/hardware?size=500")
      .then((d) => setHardware(d?.content || []))
      .catch(() => toast?.("Hardware konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = hardware
    .filter((h) => !onlyAvailable || h.status === "AVAILABLE")
    .filter((h) => `${h.name} ${h.assetTag} ${h.manufacturer || ""} ${h.model || ""}`.toLowerCase().includes(search.toLowerCase()));

  const availableCount = hardware.filter((h) => h.status === "AVAILABLE").length;

  const assign = async (hw) => {
    if (hw.status !== "AVAILABLE") return;
    setBusyId(hw.id);
    try {
      await api.post(`/loans/hardware/${hw.id}/loan`, { employeeId: employee.id, returnDate: null, notes: null });
      onAssigned();
    } catch (err) {
      toast(err?.message || "Ausleihe fehlgeschlagen");
      setBusyId(null);
    }
  };

  const statusColor = (s) => s === "AVAILABLE" ? "#10b981" : s === "LOANED" ? "#f59e0b" : "#64748b";
  const statusBg    = (s) => s === "AVAILABLE" ? "rgba(16,185,129,0.12)" : s === "LOANED" ? "rgba(245,158,11,0.12)" : "rgba(100,116,139,0.12)";
  const statusLabel = (s) => s === "AVAILABLE" ? "Verfügbar" : s === "LOANED" ? "Ausgeliehen" : s;

  return (
    <Modal title={`Hardware zuweisen – ${employee.firstName} ${employee.lastName}`} onClose={onClose} width={620}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hardware suchen (Name, Asset-Tag, Hersteller) …"
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155",
            fontSize: 13, color: "#f1f5f9", background: "#0f172a", outline: "none",
            fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
          }}
        />
        <label style={{
          display: "flex", alignItems: "center", gap: 6, padding: "0 12px",
          borderRadius: "8px", border: "1px solid #334155", cursor: "pointer",
          fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
        }}>
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
          Nur verfügbare
        </label>
      </div>

      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
        {availableCount} von {hardware.length} Geräten verfügbar
      </div>

      <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {loading ? (
          <div style={{ color: "#64748b", fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: "center", padding: 20 }}>Lade …</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: "center", padding: 20 }}>
            {hardware.length === 0 ? "Noch keine Hardware erfasst" : onlyAvailable && availableCount === 0 ? "Alle Geräte sind ausgeliehen. Haken 'Nur verfügbare' entfernen, um die gesamte Liste zu sehen." : "Keine Treffer"}
          </div>
        ) : (
          filtered.map((h) => {
            const available = h.status === "AVAILABLE";
            return (
              <button
                key={h.id}
                onClick={() => assign(h)}
                disabled={!available || busyId !== null}
                title={available ? "Zuweisen" : `Nicht verfügbar (${statusLabel(h.status)})`}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155",
                  background: busyId === h.id ? "rgba(99,102,241,0.1)" : "#1e293b",
                  cursor: !available ? "not-allowed" : busyId !== null ? "wait" : "pointer",
                  textAlign: "left", fontFamily: "'DM Sans', sans-serif", transition: "all 150ms ease",
                  opacity: !available ? 0.45 : (busyId !== null && busyId !== h.id ? 0.4 : 1),
                }}
                onMouseEnter={(e) => { if (available && busyId === null) e.currentTarget.style.borderColor = "#6366f1"; }}
                onMouseLeave={(e) => { if (available && busyId === null) e.currentTarget.style.borderColor = "#334155"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9" }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                    {h.assetTag}{h.manufacturer ? ` · ${h.manufacturer}` : ""}{h.model ? ` ${h.model}` : ""}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: "20px",
                  background: statusBg(h.status), color: statusColor(h.status),
                  whiteSpace: "nowrap", marginLeft: 10,
                }}>
                  {statusLabel(h.status)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}

function AssignSoftwareModal({ employee, onClose, onAssigned, toast }) {
  const [software, setSoftware] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [busyId, setBusyId]     = useState(null);
  const [hideExpired, setHideExpired] = useState(true);

  useEffect(() => {
    api.get("/software?size=500")
      .then((d) => setSoftware(d?.content || []))
      .catch(() => toast?.("Software konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const isExpired = (s) => s.renewalDate && new Date(s.renewalDate) < new Date();

  const filtered = software
    .filter((s) => !hideExpired || !isExpired(s))
    .filter((s) => `${s.name} ${s.vendor || ""} ${s.licenseKey || ""}`.toLowerCase().includes(search.toLowerCase()));

  const activeCount = software.filter((s) => !isExpired(s)).length;

  const assign = async (sw) => {
    if (isExpired(sw)) return;
    setBusyId(sw.id);
    try {
      await api.post(`/software/${sw.id}/assign/${employee.id}`);
      onAssigned();
    } catch (err) {
      toast(err?.message || "Zuweisung fehlgeschlagen");
      setBusyId(null);
    }
  };

  return (
    <Modal title={`Software zuweisen – ${employee.firstName} ${employee.lastName}`} onClose={onClose} width={620}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Software suchen (Name, Hersteller) …"
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155",
            fontSize: 13, color: "#f1f5f9", background: "#0f172a", outline: "none",
            fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
          }}
        />
        <label style={{
          display: "flex", alignItems: "center", gap: 6, padding: "0 12px",
          borderRadius: "8px", border: "1px solid #334155", cursor: "pointer",
          fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
        }}>
          <input type="checkbox" checked={hideExpired} onChange={(e) => setHideExpired(e.target.checked)} />
          Abgelaufene ausblenden
        </label>
      </div>

      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
        {activeCount} von {software.length} Lizenzen aktiv
      </div>

      <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {loading ? (
          <div style={{ color: "#64748b", fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: "center", padding: 20 }}>Lade …</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: "center", padding: 20 }}>
            {software.length === 0 ? "Noch keine Software erfasst" : "Keine Treffer"}
          </div>
        ) : (
          filtered.map((s) => {
            const expired = isExpired(s);
            return (
              <button
                key={s.id}
                onClick={() => assign(s)}
                disabled={expired || busyId !== null}
                title={expired ? "Lizenz abgelaufen" : "Zuweisen"}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155",
                  background: busyId === s.id ? "rgba(99,102,241,0.1)" : "#1e293b",
                  cursor: expired ? "not-allowed" : busyId !== null ? "wait" : "pointer",
                  textAlign: "left", fontFamily: "'DM Sans', sans-serif", transition: "all 150ms ease",
                  opacity: expired ? 0.45 : (busyId !== null && busyId !== s.id ? 0.4 : 1),
                }}
                onMouseEnter={(e) => { if (!expired && busyId === null) e.currentTarget.style.borderColor = "#6366f1"; }}
                onMouseLeave={(e) => { if (!expired && busyId === null) e.currentTarget.style.borderColor = "#334155"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                    {s.vendor || "–"}{s.renewalDate ? ` · Erneuerung ${new Date(s.renewalDate).toLocaleDateString("de-DE")}` : ""}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: "20px",
                  background: expired ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                  color: expired ? "#ef4444" : "#10b981",
                  whiteSpace: "nowrap", marginLeft: 10,
                }}>
                  {expired ? "Abgelaufen" : "Aktiv"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}

export default EmployeesPage;
