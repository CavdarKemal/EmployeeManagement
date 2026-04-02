import { useState } from "react";

const ROLES = ["ADMIN", "HR", "IT", "VIEWER"];

const ROLE_CONFIG = {
  ADMIN:  { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   label: "Admin",  icon: "A", desc: "Vollzugriff auf alle Funktionen" },
  HR:     { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "HR",     icon: "H", desc: "Mitarbeiterdaten lesen und bearbeiten" },
  IT:     { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  label: "IT",     icon: "I", desc: "Hardware und Software verwalten" },
  VIEWER: { color: "#64748b", bg: "rgba(100,116,139,0.12)", label: "Viewer", icon: "V", desc: "Nur lesender Zugriff" },
};

// Simulierte Benutzerdaten
const MOCK_USERS = [
  { id: 1, email: "admin@firma.de",     displayName: "System Admin",  role: "ADMIN",  enabled: true, accountNonLocked: true,  lastLoginAt: "2024-12-01T09:15:00", createdAt: "2024-01-01" },
  { id: 2, email: "hr.meyer@firma.de",  displayName: "Maria Meyer",   role: "HR",     enabled: true, accountNonLocked: true,  lastLoginAt: "2024-12-01T08:30:00", createdAt: "2024-03-15" },
  { id: 3, email: "it.schmidt@firma.de",displayName: "Klaus Schmidt", role: "IT",     enabled: true, accountNonLocked: true,  lastLoginAt: "2024-11-30T14:20:00", createdAt: "2024-02-10" },
  { id: 4, email: "view.only@firma.de", displayName: "Leser Müller",  role: "VIEWER", enabled: true, accountNonLocked: false, lastLoginAt: null,                  createdAt: "2024-06-01" },
];

function getRoleDescription(role) {
  return ROLE_CONFIG[role]?.desc || "";
}

export function AdminPage({ toast }) {
  const [users, setUsers]         = useState(MOCK_USERS);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [confirmAction, setConfirm] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = users.filter((u) =>
    `${u.email} ${u.displayName}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (userId, newRole) => {
    setUsers((u) => u.map((usr) => usr.id === userId ? { ...usr, role: newRole } : usr));
    toast(`Rolle erfolgreich geändert auf ${newRole}`);
  };

  const handleToggleLock = (userId) => {
    const user = users.find((u) => u.id === userId);
    setUsers((u) => u.map((usr) =>
      usr.id === userId ? { ...usr, accountNonLocked: !usr.accountNonLocked } : usr
    ));
    toast(user.accountNonLocked ? "Account gesperrt" : "Account entsperrt");
    setConfirm(null);
  };

  const handleCreate = (newUser) => {
    setUsers((u) => [...u, { ...newUser, id: Date.now(), createdAt: new Date().toISOString() }]);
    toast("Benutzer angelegt");
    setShowForm(false);
  };

  const roleCounts = ROLES.reduce((acc, r) => ({
    ...acc, [r]: users.filter((u) => u.role === r).length,
  }), {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Role cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {ROLES.map((role) => {
          const rc = ROLE_CONFIG[role];
          return (
            <div
              key={role}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  background: rc.bg,
                  color: rc.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "'Sora', sans-serif",
                  flexShrink: 0,
                }}
              >
                {rc.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#f1f5f9",
                    fontFamily: "'Sora', sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {roleCounts[role]}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>
                  {rc.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10 }}>
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
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Benutzer suchen ..."
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
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 18px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            transition: "background 150ms ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#4f46e5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#6366f1")}
        >
          + Benutzer
        </button>
      </div>

      {/* User table */}
      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#0f172a" }}>
            <tr>
              {["Benutzer", "Rolle", "Status", "Letzter Login", "Erstellt", "Aktionen"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "'DM Sans', sans-serif",
                    borderBottom: "1px solid #334155",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => {
              const rc = ROLE_CONFIG[user.role];
              return (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid #334155" : "none",
                    background: !user.accountNonLocked ? "rgba(239,68,68,0.03)" : "transparent",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = !user.accountNonLocked ? "rgba(239,68,68,0.03)" : "transparent")}
                >
                  {/* User */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: rc.bg,
                          color: rc.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: "'Sora', sans-serif",
                          flexShrink: 0,
                        }}
                      >
                        {user.displayName[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
                          {user.displayName}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.id === 1}
                        style={{
                          padding: "5px 28px 5px 10px",
                          borderRadius: "6px",
                          border: `1px solid ${rc.color}40`,
                          background: rc.bg,
                          color: rc.color,
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                          cursor: user.id === 1 ? "not-allowed" : "pointer",
                          opacity: user.id === 1 ? 0.5 : 1,
                          appearance: "none",
                          WebkitAppearance: "none",
                          outline: "none",
                          transition: "opacity 150ms ease",
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} style={{ background: "#1e293b", color: "#f1f5f9" }}>
                            {ROLE_CONFIG[r].label}
                          </option>
                        ))}
                      </select>
                      <span
                        style={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: rc.color,
                          pointerEvents: "none",
                          fontSize: 11,
                        }}
                      >
                        ▾
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        background: user.accountNonLocked ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                        color: user.accountNonLocked ? "#10b981" : "#ef4444",
                      }}
                    >
                      {user.accountNonLocked ? "Aktiv" : "Gesperrt"}
                    </span>
                  </td>

                  {/* Last login */}
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("de-DE")
                      : <span style={{ color: "#334155" }}>Noch nie</span>}
                  </td>

                  {/* Created */}
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>
                    {new Date(user.createdAt).toLocaleDateString("de-DE")}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setConfirm({ type: "lock", user })}
                        disabled={user.id === 1}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          border: "1px solid #334155",
                          background: "transparent",
                          color: user.accountNonLocked ? "#f59e0b" : "#10b981",
                          cursor: user.id === 1 ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontFamily: "'DM Sans', sans-serif",
                          opacity: user.id === 1 ? 0.3 : 1,
                          transition: "all 150ms ease",
                        }}
                        onMouseEnter={(e) => {
                          if (user.id !== 1) {
                            e.currentTarget.style.background = user.accountNonLocked ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)";
                          }
                        }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        {user.accountNonLocked ? "Sperren" : "Entsperren"}
                      </button>
                      <button
                        onClick={() => setConfirm({ type: "password", user })}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          border: "1px solid #334155",
                          background: "transparent",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: 12,
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all 150ms ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#f1f5f9"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                      >
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

      {/* Create user modal */}
      {showForm && (
        <CreateUserModal onSave={handleCreate} onClose={() => setShowForm(false)} />
      )}

      {/* Confirm dialog */}
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
  const [form, setForm] = useState({ email: "", displayName: "", role: "VIEWER", initialPassword: "" });
  const [errors, setErrors] = useState({});
  const [fieldFocus, setFieldFocus] = useState({});

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Gültige E-Mail erforderlich";
    if (!form.displayName) e.displayName = "Pflichtfeld";
    if (!form.initialPassword || form.initialPassword.length < 8) e.initialPassword = "Mindestens 8 Zeichen";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, enabled: true, accountNonLocked: true, lastLoginAt: null });
  };

  const inputStyle = (fieldKey) => ({
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: `1px solid ${errors[fieldKey] ? "#ef4444" : fieldFocus[fieldKey] ? "#6366f1" : "#334155"}`,
    fontSize: 13,
    color: "#f1f5f9",
    background: "#0f172a",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
    boxShadow: fieldFocus[fieldKey] ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  });

  const rc = ROLE_CONFIG[form.role];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#1e293b",
          borderRadius: "12px",
          border: "1px solid #334155",
          width: "100%",
          maxWidth: 440,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}>
            Neuer Benutzer
          </h3>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 20,
              color: "#94a3b8",
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: "6px",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>
              E-Mail *
            </label>
            <input
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onFocus={() => setFieldFocus((f) => ({ ...f, email: true }))}
              onBlur={() => setFieldFocus((f) => ({ ...f, email: false }))}
              placeholder="name@firma.de"
              style={inputStyle("email")}
            />
            {errors.email && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{errors.email}</div>}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>
              Anzeigename *
            </label>
            <input
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              onFocus={() => setFieldFocus((f) => ({ ...f, displayName: true }))}
              onBlur={() => setFieldFocus((f) => ({ ...f, displayName: false }))}
              placeholder="Max Mustermann"
              style={inputStyle("displayName")}
            />
            {errors.displayName && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{errors.displayName}</div>}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>
              Rolle
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                style={{
                  ...inputStyle("role"),
                  paddingRight: 36,
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
                onFocus={() => setFieldFocus((f) => ({ ...f, role: true }))}
                onBlur={() => setFieldFocus((f) => ({ ...f, role: false }))}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} style={{ background: "#1e293b", color: "#f1f5f9" }}>
                    {ROLE_CONFIG[r].label} – {getRoleDescription(r)}
                  </option>
                ))}
              </select>
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", fontSize: 14 }}>▾</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>
              Initiales Passwort *
            </label>
            <input
              type="password"
              value={form.initialPassword}
              onChange={(e) => set("initialPassword", e.target.value)}
              onFocus={() => setFieldFocus((f) => ({ ...f, initialPassword: true }))}
              onBlur={() => setFieldFocus((f) => ({ ...f, initialPassword: false }))}
              placeholder="Mindestens 8 Zeichen"
              style={inputStyle("initialPassword")}
            />
            {errors.initialPassword && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{errors.initialPassword}</div>}
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
              Der Benutzer sollte das Passwort beim ersten Login ändern.
            </div>
          </div>

          {/* Role info */}
          <div
            style={{
              background: rc.bg,
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: 12,
              color: rc.color,
              border: `1px solid ${rc.color}30`,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <strong>{rc.label}:</strong> {getRoleDescription(form.role)}
          </div>
        </div>

        <div
          style={{
            padding: "0 22px 22px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#4f46e5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#6366f1")}
          >
            Anlegen
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ action, onConfirm, onClose }) {
  const isLock  = action.type === "lock";
  const willLock = action.user.accountNonLocked;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: 28,
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: willLock ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 24,
          }}
        >
          {isLock && willLock ? "🔒" : "🔓"}
        </div>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: 16,
            fontWeight: 600,
            color: "#f1f5f9",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {isLock && willLock ? "Account sperren?" : "Account entsperren?"}
        </h3>
        <p
          style={{
            color: "#64748b",
            fontSize: 13,
            margin: "0 0 24px",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.6,
          }}
        >
          {willLock
            ? `${action.user.displayName} kann sich nach dem Sperren nicht mehr anmelden.`
            : `${action.user.displayName} erhält wieder Zugang zum System.`}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              background: willLock ? "#ef4444" : "#10b981",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = willLock ? "#dc2626" : "#059669")}
            onMouseLeave={(e) => (e.currentTarget.style.background = willLock ? "#ef4444" : "#10b981")}
          >
            {willLock ? "Sperren" : "Entsperren"}
          </button>
        </div>
      </div>
    </div>
  );
}
