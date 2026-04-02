import { useState } from "react";
import { T, DEPT } from "../components/tokens.js";
import Avatar from "../components/Avatar.jsx";
import Badge from "../components/Badge.jsx";
import Btn from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";

// Mock data
const INITIAL_EMPLOYEES = [
  { id: 1, employeeNumber: "EMP-001", firstName: "Maximilian", lastName: "Bauer",  email: "m.bauer@firma.de",   phone: "+49 30 1234567", position: "Senior Developer", department: "Engineering",  hireDate: "2021-03-15", salary: 85000, active: true },
  { id: 2, employeeNumber: "EMP-002", firstName: "Sophie",     lastName: "Müller", email: "s.mueller@firma.de", phone: "+49 89 9876543", position: "Product Manager",  department: "Product",      hireDate: "2020-07-01", salary: 90000, active: true },
  { id: 3, employeeNumber: "EMP-003", firstName: "Jonas",      lastName: "Weber",  email: "j.weber@firma.de",   phone: "+49 40 5555888", position: "UX Designer",      department: "Design",       hireDate: "2022-01-10", salary: 72000, active: true },
];

// ── Employee Form Modal ──────────────────────────────────────
function EmployeeFormModal({ employee, onSave, onClose }) {
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
      // In der Produktionsversion: await api.post/put(...)
      await new Promise((r) => setTimeout(r, 500));
      onSave({ ...form, id: form.id ?? Date.now(), salary: Number(form.salary) });
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
          <input type="checkbox" id="active" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
          <label htmlFor="active" style={{ fontSize: 13, color: T.text }}>Aktiv</label>
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
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [selected, setSelected]   = useState(null);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editEmp, setEditEmp]     = useState(null);

  const filtered = employees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.department} ${e.position}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const emp = employees.find((e) => e.id === selected);

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
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, Nummer, Abteilung suchen …"
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: 9,
              border: `1px solid ${T.border}`, fontSize: 13, outline: "none",
              background: "#fff", boxSizing: "border-box",
            }}
          />
        </div>
        <Btn onClick={() => { setEditEmp(null); setShowForm(true); }}>＋ Mitarbeiter</Btn>
      </div>

      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
        {/* Master List */}
        <div style={{ width: 280, flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((e) => (
            <div
              key={e.id}
              onClick={() => setSelected(e.id)}
              style={{
                background: selected === e.id ? "#eef2ff" : "#fff",
                border: `1.5px solid ${selected === e.id ? T.primaryLight : T.border}`,
                borderRadius: 11, padding: "11px 13px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 11, transition: "all .15s",
              }}
            >
              <Avatar name={`${e.firstName} ${e.lastName}`} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, display: "flex", justifyContent: "space-between" }}>
                  {e.firstName} {e.lastName}
                  {!e.active && <Badge label="Inaktiv" color={T.danger} bg="#fee2e2" sm />}
                </div>
                <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>{e.position}</div>
                <div style={{ marginTop: 5 }}>
                  <Badge label={e.department} color={DEPT[e.department] || T.textMuted} bg={(DEPT[e.department] || T.textMuted) + "22"} sm />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {!emp ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T.textMuted }}>
              <span style={{ fontSize: 48 }}>👤</span>
              <div style={{ fontSize: 14 }}>Mitarbeiter auswählen</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Card style={{ borderTop: `4px solid ${DEPT[emp.department] || T.primary}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <Avatar name={`${emp.firstName} ${emp.lastName}`} size={60} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>{emp.firstName} {emp.lastName}</h2>
                      <Badge label={emp.active ? "Aktiv" : "Inaktiv"} color={emp.active ? T.success : T.danger} bg={emp.active ? "#d1fae5" : "#fee2e2"} />
                    </div>
                    <div style={{ color: T.primary, fontWeight: 600, marginTop: 4, fontSize: 14 }}>{emp.position}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <Badge label={emp.department} color={DEPT[emp.department] || T.textMuted} bg={(DEPT[emp.department] || T.textMuted) + "22"} />
                      <Badge label={emp.employeeNumber} color={T.text} bg={T.bg} />
                    </div>
                  </div>
                  <Btn sm variant="ghost" onClick={() => { setEditEmp(emp); setShowForm(true); }}>✏️ Bearbeiten</Btn>
                </div>
              </Card>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { icon: "📧", label: "E-Mail",      value: emp.email },
                  { icon: "📞", label: "Telefon",     value: emp.phone || "—" },
                  { icon: "📅", label: "Eingestellt", value: new Date(emp.hireDate).toLocaleDateString("de-DE") },
                  { icon: "💶", label: "Gehalt",      value: `${emp.salary?.toLocaleString("de-DE")} €/Jahr` },
                ].map((item) => (
                  <Card key={item.label} p={14}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginTop: 2 }}>{item.value}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>💻 Zugewiesene Hardware</div>
                <div style={{ color: T.textMuted, fontSize: 13 }}>Hardware-Tab für Details öffnen.</div>
              </Card>
              <Card>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>📦 Software &amp; Lizenzen</div>
                <div style={{ color: T.textMuted, fontSize: 13 }}>Software-Tab für Details öffnen.</div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <EmployeeFormModal
          employee={editEmp}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditEmp(null); }}
        />
      )}
    </div>
  );
}

export default EmployeesPage;
