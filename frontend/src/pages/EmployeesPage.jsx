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


// ── Employee Form Modal ──────────────────────────────────────
function EmployeeFormModal({ employee, onSave, onClose, toast }) {
  const initial = employee ?? {
    employeeNumber: "", firstName: "", lastName: "", email: "",
    phone: "", position: "", department: "", hireDate: "", salary: "", active: true,
  };
  const [form, setForm]     = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
      let result;
      if (form.id) {
        result = await api.put(`/employees/${form.id}`, payload);
      } else {
        const formData = new FormData();
        formData.append("employee", new Blob([JSON.stringify(payload)], { type: "application/json" }));
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 20 }}>
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
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editEmp, setEditEmp]     = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

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
                <Avatar name={`${e.firstName} ${e.lastName}`} size={38} />
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
                  <Avatar name={`${emp.firstName} ${emp.lastName}`} size={60} />
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
                <div style={{ gridColumn: "1 / -1" }}>
                  <div
                    style={{
                      borderTop: "1px solid #1e293b",
                      paddingTop: 16,
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontFamily: "'DM Sans', sans-serif",
                        marginBottom: 8,
                      }}
                    >
                      ZUGEWIESENE HARDWARE
                    </div>
                    <div style={{ fontSize: 13, color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>
                      Hardware-Tab für Details öffnen.
                    </div>
                  </div>
                </div>

                {/* Software section */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontFamily: "'DM Sans', sans-serif",
                        marginBottom: 8,
                      }}
                    >
                      SOFTWARE & LIZENZEN
                    </div>
                    <div style={{ fontSize: 13, color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>
                      Software-Tab für Details öffnen.
                    </div>
                  </div>
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
    </div>
  );
}

export default EmployeesPage;
