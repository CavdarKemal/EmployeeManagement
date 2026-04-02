import { useState, useEffect } from "react";

const ROLES = ["ADMIN", "HR", "IT", "VIEWER"];

const ROLE_CONFIG = {
  ADMIN:  { color: "#dc2626", bg: "#fee2e2", label: "Admin" },
  HR:     { color: "#d97706", bg: "#fef3c7", label: "HR" },
  IT:     { color: "#2563eb", bg: "#dbeafe", label: "IT" },
  VIEWER: { color: "#6b7280", bg: "#f3f4f6", label: "Viewer" },
};

// Simulierte Benutzerdaten
const MOCK_USERS = [
  { id:1, email:"admin@firma.de", displayName:"System Admin", role:"ADMIN",
    enabled:true, accountNonLocked:true, lastLoginAt:"2024-12-01T09:15:00", createdAt:"2024-01-01" },
  { id:2, email:"hr.meyer@firma.de", displayName:"Maria Meyer", role:"HR",
    enabled:true, accountNonLocked:true, lastLoginAt:"2024-12-01T08:30:00", createdAt:"2024-03-15" },
  { id:3, email:"it.schmidt@firma.de", displayName:"Klaus Schmidt", role:"IT",
    enabled:true, accountNonLocked:true, lastLoginAt:"2024-11-30T14:20:00", createdAt:"2024-02-10" },
  { id:4, email:"view.only@firma.de", displayName:"Leser Müller", role:"VIEWER",
    enabled:true, accountNonLocked:false, lastLoginAt:null, createdAt:"2024-06-01" },
];

export function AdminPage({ toast }) {
  const [users, setUsers]         = useState(MOCK_USERS);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [confirmAction, setConfirm] = useState(null);

  const filtered = users.filter(u =>
    `${u.email} ${u.displayName}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (userId, newRole) => {
    setUsers(u => u.map(usr => usr.id === userId ? { ...usr, role: newRole } : usr));
    toast(`Rolle erfolgreich geändert auf ${newRole}`);
  };

  const handleToggleLock = (userId) => {
    setUsers(u => u.map(usr =>
      usr.id === userId
        ? { ...usr, accountNonLocked: !usr.accountNonLocked }
        : usr
    ));
    const user = users.find(u => u.id === userId);
    toast(user.accountNonLocked ? "Account gesperrt" : "Account entsperrt");
    setConfirm(null);
  };

  const handleCreate = (newUser) => {
    setUsers(u => [...u, { ...newUser, id: Date.now(), createdAt: new Date().toISOString() }]);
    toast("Benutzer angelegt");
    setShowForm(false);
  };

  const roleCounts = ROLES.reduce((acc, r) => ({
    ...acc, [r]: users.filter(u => u.role === r).length
  }), {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Rollen-Übersicht */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {ROLES.map(role => (
          <div key={role} style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: ROLE_CONFIG[role].bg, color: ROLE_CONFIG[role].color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700,
            }}>
              {ROLE_CONFIG[role].label[0]}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{roleCounts[role]}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{ROLE_CONFIG[role].label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Benutzer suchen ..."
          style={{ flex: 1, padding: "9px 12px", borderRadius: 9,
            border: "1px solid #e5e7eb", fontSize: 13, outline: "none" }}
        />
        <button
          onClick={() => setShowForm(true)}
          style={{ padding: "9px 18px", background: "#4f46e5", color: "#fff",
            border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Benutzer
        </button>
      </div>

      {/* Benutzertabelle */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr style={{ fontSize: 11, color: "#6b7280", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {["Benutzer", "Rolle", "Status", "Letzter Login", "Erstellt", "Aktionen"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left",
                  borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => {
              const rc = ROLE_CONFIG[user.role];
              return (
                <tr key={user.id} style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                  background: !user.accountNonLocked ? "#fef2f2" : "transparent",
                }}>
                  {/* Benutzer */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 18,
                        background: rc.bg, color: rc.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700,
                      }}>
                        {user.displayName[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{user.displayName}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Rolle (änderbar) */}
                  <td style={{ padding: "12px 16px" }}>
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      disabled={user.id === 1} // System-Admin schützen
                      style={{
                        padding: "4px 10px", borderRadius: 8,
                        border: `1.5px solid ${rc.color}`,
                        background: rc.bg, color: rc.color,
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        opacity: user.id === 1 ? 0.5 : 1,
                      }}>
                      {ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: user.accountNonLocked ? "#d1fae5" : "#fee2e2",
                      color: user.accountNonLocked ? "#059669" : "#dc2626",
                    }}>
                      {user.accountNonLocked ? "Aktiv" : "Gesperrt"}
                    </span>
                  </td>

                  {/* Letzter Login */}
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("de-DE")
                      : "Noch nie"}
                  </td>

                  {/* Erstellt */}
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>
                    {new Date(user.createdAt).toLocaleDateString("de-DE")}
                  </td>

                  {/* Aktionen */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setConfirm({ type: "lock", user })}
                        disabled={user.id === 1}
                        title={user.accountNonLocked ? "Sperren" : "Entsperren"}
                        style={{
                          padding: "5px 10px", borderRadius: 7,
                          border: "1px solid #e5e7eb", background: "#fff",
                          cursor: user.id === 1 ? "not-allowed" : "pointer",
                          fontSize: 13, opacity: user.id === 1 ? 0.4 : 1,
                        }}>
                        {user.accountNonLocked ? "Sperren" : "Entsperren"}
                      </button>
                      <button
                        onClick={() => setConfirm({ type: "password", user })}
                        title="Passwort zurücksetzen"
                        style={{
                          padding: "5px 10px", borderRadius: 7,
                          border: "1px solid #e5e7eb", background: "#fff",
                          cursor: "pointer", fontSize: 13,
                        }}>
                        PW Reset
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Benutzer anlegen Modal */}
      {showForm && (
        <CreateUserModal onSave={handleCreate} onClose={() => setShowForm(false)} />
      )}

      {/* Bestätigungs-Dialog */}
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          onConfirm={() => {
            if (confirmAction.type === "lock") handleToggleLock(confirmAction.user.id);
          }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    email: "", displayName: "", role: "VIEWER", initialPassword: ""
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Gültige E-Mail erforderlich";
    if (!form.displayName) e.displayName = "Pflichtfeld";
    if (!form.initialPassword || form.initialPassword.length < 8)
      e.initialPassword = "Mindestens 8 Zeichen";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, enabled: true, accountNonLocked: true, lastLoginAt: null });
  };

  const inputStyle = (err) => ({
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1.5px solid ${err ? "#dc2626" : "#e5e7eb"}`,
    fontSize: 13, outline: "none", boxSizing: "border-box",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440,
        overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Neuer Benutzer</h3>
          <button onClick={onClose} style={{ border: "none", background: "none",
            cursor: "pointer", fontSize: 20, color: "#6b7280" }}>x</button>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>
              E-Mail *
            </label>
            <input value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="name@firma.de" style={inputStyle(errors.email)} />
            {errors.email && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>{errors.email}</div>}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>
              Anzeigename *
            </label>
            <input value={form.displayName} onChange={e => set("displayName", e.target.value)}
              placeholder="Max Mustermann" style={inputStyle(errors.displayName)} />
            {errors.displayName && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>{errors.displayName}</div>}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>Rolle</label>
            <select value={form.role} onChange={e => set("role", e.target.value)}
              style={{ ...inputStyle(false), cursor: "pointer" }}>
              {ROLES.map(r => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label} – {getRoleDescription(r)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>
              Initiales Passwort *
            </label>
            <input type="password" value={form.initialPassword}
              onChange={e => set("initialPassword", e.target.value)}
              placeholder="Mindestens 8 Zeichen" style={inputStyle(errors.initialPassword)} />
            {errors.initialPassword && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>{errors.initialPassword}</div>}
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              Der Benutzer sollte das Passwort beim ersten Login ändern.
            </div>
          </div>

          {/* Rollen-Info */}
          <div style={{ background: "#f8fafc", borderRadius: 9, padding: "10px 12px",
            fontSize: 12, color: "#374151", border: "1px solid #e5e7eb" }}>
            <strong>{ROLE_CONFIG[form.role].label}:</strong> {getRoleDescription(form.role)}
          </div>
        </div>

        <div style={{ padding: "0 22px 22px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 8,
            border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13 }}>
            Abbrechen
          </button>
          <button onClick={handleSave} style={{ padding: "9px 18px", borderRadius: 8,
            background: "#4f46e5", color: "#fff", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600 }}>
            Anlegen
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ action, onConfirm, onClose }) {
  const isLock = action.type === "lock";
  const willLock = action.user.accountNonLocked;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, maxWidth: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,.25)", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>
          {isLock && willLock ? "Sperren" : "Entsperren"}
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
          {isLock && willLock ? "Account sperren?" : "Account entsperren?"}
        </h3>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 20px" }}>
          {willLock
            ? `${action.user.displayName} kann sich nach dem Sperren nicht mehr anmelden.`
            : `${action.user.displayName} erhält wieder Zugang zum System.`}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8,
            border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13 }}>
            Abbrechen
          </button>
          <button onClick={onConfirm} style={{ padding: "9px 18px", borderRadius: 8,
            background: willLock ? "#dc2626" : "#059669", color: "#fff",
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            {willLock ? "Sperren" : "Entsperren"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getRoleDescription(role) {
  const desc = {
    ADMIN:  "Vollzugriff auf alle Funktionen",
    HR:     "Mitarbeiterdaten lesen und bearbeiten",
    IT:     "Hardware und Software verwalten",
    VIEWER: "Nur lesender Zugriff",
  };
  return desc[role] || "";
}
