import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

// ── Mini-Mockup-Komponenten ──────────────────────────────────
function MockBar({ label, pct, color }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#64748b", marginBottom: 2 }}>
        <span>{label}</span><span>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function MockKpi({ icon, value, label, color }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, border: "1px solid #334155" }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

function MockRow({ name, dept, badge }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderBottom: "1px solid #1e293b" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#6366f122", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
        {name[0]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: 8, color: "#64748b" }}>{dept}</div>
      </div>
      <div style={{ fontSize: 8, padding: "2px 6px", borderRadius: 10, background: badge.bg, color: badge.color }}>{badge.label}</div>
    </div>
  );
}

function MockHwRow({ emoji, name, avail, total, category }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: 8, color: "#64748b" }}>{category}</div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: avail > 0 ? "#34d399" : "#f59e0b", fontFamily: "monospace" }}>{avail}/{total}</span>
    </div>
  );
}

function MockSwCard({ emoji, name, vendor, used, total, color }) {
  const pct = Math.round((used / total) * 100);
  return (
    <div style={{ background: "#0f172a", borderRadius: 6, padding: 10, border: "1px solid #334155" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{emoji}</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9" }}>{name}</div>
          <div style={{ fontSize: 8, color: "#64748b" }}>{vendor}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#64748b", marginBottom: 3 }}>
        <span>Lizenzen</span><span style={{ color: pct >= 85 ? "#f59e0b" : "#94a3b8", fontFamily: "monospace" }}>{used}/{total}</span>
      </div>
      <div style={{ height: 4, background: "#334155", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 85 ? "#f59e0b" : color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function MockUserRow({ name, email, role, rc, status }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderBottom: "1px solid #1e293b" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: rc.bg, color: rc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{name[0]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: 8, color: "#64748b" }}>{email}</div>
      </div>
      <div style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: rc.bg, color: rc.color, marginRight: 6 }}>{role}</div>
      <div style={{ fontSize: 8, padding: "2px 6px", borderRadius: 10, background: status ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: status ? "#10b981" : "#ef4444" }}>{status ? "Aktiv" : "Gesperrt"}</div>
    </div>
  );
}

function MockAuditRow({ time, user, action, path, status }) {
  const colors = { POST: "#10b981", PUT: "#3b82f6", DELETE: "#ef4444" };
  const labels = { POST: "Erstellt", PUT: "Geändert", DELETE: "Gelöscht" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: 8, color: "#64748b", fontFamily: "monospace", whiteSpace: "nowrap" }}>{time}</span>
      <span style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 500, minWidth: 60 }}>{user}</span>
      <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 10, background: colors[action] + "22", color: colors[action] }}>{labels[action]}</span>
      <span style={{ fontSize: 8, color: "#94a3b8", fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{path}</span>
      <span style={{ fontSize: 9, fontFamily: "monospace", color: status < 400 ? "#10b981" : "#ef4444", fontWeight: 700 }}>{status}</span>
    </div>
  );
}

// ── Sidebar-Mockup ────────────────────────────────────────────
function MockSidebar({ active }) {
  const items = [
    { id: "dashboard", label: "Dashboard" },
    { id: "employees", label: "Mitarbeiter" },
    { id: "hardware",  label: "Hardware" },
    { id: "software",  label: "Software" },
    { id: "admin",     label: "Benutzer" },
    { id: "audit",     label: "Audit-Log" },
    { id: "notify",    label: "Benachr." },
  ];
  return (
    <div style={{ width: 90, background: "#1e293b", borderRight: "1px solid #334155", display: "flex", flexDirection: "column", padding: "8px 0" }}>
      <div style={{ padding: "6px 10px", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: "#fff" }}>EM</div>
        <span style={{ fontSize: 8, color: "#f1f5f9", fontWeight: 600 }}>Employee</span>
      </div>
      {items.map((item) => (
        <div key={item.id} style={{
          padding: "4px 8px",
          fontSize: 9,
          color: active === item.id ? "#a5b4fc" : "#64748b",
          background: active === item.id ? "rgba(99,102,241,0.12)" : "transparent",
          borderLeft: active === item.id ? "2px solid #6366f1" : "2px solid transparent",
          marginBottom: 1,
          fontWeight: active === item.id ? 600 : 400,
        }}>{item.label}</div>
      ))}
    </div>
  );
}

// ── Voller Screen-Mockup ─────────────────────────────────────
function ScreenMockup({ active, children }) {
  return (
    <div style={{
      border: "1px solid #334155",
      borderRadius: 8,
      overflow: "hidden",
      background: "#0f172a",
      display: "flex",
      height: 220,
      flexShrink: 0,
      width: "100%",
    }}>
      <MockSidebar active={active} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "6px 12px", borderBottom: "1px solid #1e293b", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9" }}>
            {active === "dashboard" ? "Dashboard" : active === "employees" ? "Mitarbeiter" : active === "hardware" ? "Hardware" : active === "software" ? "Software & Lizenzen" : active === "admin" ? "Benutzer" : active === "audit" ? "Audit-Log" : "Benachrichtigungen"}
          </span>
          <span style={{ fontSize: 8, color: "#475569" }}>16. April 2026</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden", padding: 10 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Hilfe-Sektion ─────────────────────────────────────────────
function HelpSection({ id, title, subtitle, icon, mockup, features, roles, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      id={id}
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "12px",
        overflow: "hidden",
        scrollMarginTop: 20,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          borderBottom: open ? "1px solid #334155" : "none",
          transition: "background 150ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.04)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ fontSize: 24, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}>{title}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{subtitle}</div>
        </div>
        {roles && (
          <div style={{ display: "flex", gap: 4, marginRight: 12 }}>
            {roles.map((r) => {
              const colors = { ADMIN: "#ef4444", HR: "#f59e0b", IT: "#3b82f6", VIEWER: "#64748b", ALL: "#10b981" };
              return (
                <span key={r} style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                  background: (colors[r] || "#64748b") + "22", color: colors[r] || "#64748b",
                  fontFamily: "'DM Sans', sans-serif",
                }}>{r}</span>
              );
            })}
          </div>
        )}
        <span style={{ fontSize: 14, color: "#475569", flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Mockup */}
          {mockup}

          {/* Features */}
          {features && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
                Funktionen im Überblick
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#6366f1", fontSize: 14, flexShrink: 0, marginTop: 1 }}>→</span>
                    <span style={{ fontSize: 13, color: "#cbd5e1", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra content */}
          {children}
        </div>
      )}
    </div>
  );
}

// ── Info-Box ─────────────────────────────────────────────────
function InfoBox({ color, icon, title, children }) {
  const colors = {
    blue:   { border: "rgba(59,130,246,0.3)",  bg: "rgba(59,130,246,0.08)",  text: "#3b82f6"  },
    yellow: { border: "rgba(245,158,11,0.3)",  bg: "rgba(245,158,11,0.08)",  text: "#f59e0b"  },
    green:  { border: "rgba(16,185,129,0.3)",  bg: "rgba(16,185,129,0.08)",  text: "#10b981"  },
    red:    { border: "rgba(239,68,68,0.3)",   bg: "rgba(239,68,68,0.08)",   text: "#ef4444"  },
    indigo: { border: "rgba(99,102,241,0.3)",  bg: "rgba(99,102,241,0.08)",  text: "#6366f1"  },
  };
  const c = colors[color] || colors.blue;
  return (
    <div style={{ border: `1px solid ${c.border}`, background: c.bg, borderRadius: 8, padding: "12px 16px", display: "flex", gap: 12 }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div>
        {title && <div style={{ fontSize: 13, fontWeight: 600, color: c.text, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{title}</div>}
        <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Rollen-Tabelle ───────────────────────────────────────────
function RoleTable() {
  const rows = [
    { role: "ADMIN",  color: "#ef4444", bg: "rgba(239,68,68,0.12)",   desc: "Vollzugriff: Alle Seiten, alle Aktionen, Benutzerverwaltung" },
    { role: "HR",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  desc: "Mitarbeiter anlegen, bearbeiten, löschen; Hardware/Software nur lesen" },
    { role: "IT",     color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  desc: "Hardware & Software verwalten und zuweisen; Mitarbeiter nur lesen" },
    { role: "VIEWER", color: "#64748b", bg: "rgba(100,116,139,0.12)", desc: "Nur lesender Zugriff auf alle Bereiche — keine Änderungen möglich" },
  ];
  return (
    <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#0f172a" }}>
          <tr>
            {["Rolle", "Berechtigungen"].map((h) => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.role} style={{ borderTop: "1px solid #334155" }}>
              <td style={{ padding: "10px 14px" }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 10, background: r.bg, color: r.color, fontFamily: "'DM Sans', sans-serif" }}>{r.role}</span>
              </td>
              <td style={{ padding: "10px 14px", fontSize: 12, color: "#cbd5e1", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Haupt-Komponente ─────────────────────────────────────────
function HelpPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const sections = [
    "login", "dashboard", "employees", "hardware", "software",
    ...(isAdmin ? ["admin", "audit", "notify"] : []),
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>

      {/* Titel */}
      <div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}>
          Benutzerhandbuch
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#64748b", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
          Schritt-für-Schritt-Anleitung zu allen Funktionen von EmployeeManagement.
        </p>
      </div>

      {/* Schnellnavigation */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
          Auf dieser Seite
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "login",     label: "Anmeldung",      icon: "🔐" },
            { id: "dashboard", label: "Dashboard",       icon: "📊" },
            { id: "employees", label: "Mitarbeiter",     icon: "👥" },
            { id: "hardware",  label: "Hardware",        icon: "💻" },
            { id: "software",  label: "Software",        icon: "🔑" },
            ...(isAdmin ? [
              { id: "admin",  label: "Benutzer",          icon: "⚙️" },
              { id: "audit",  label: "Audit-Log",         icon: "📋" },
              { id: "notify", label: "Benachrichtigungen", icon: "📧" },
            ] : []),
            { id: "roles",  label: "Rollen",             icon: "🛡️" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#a5b4fc",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 150ms ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; e.currentTarget.style.borderColor = "#6366f1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0f172a"; e.currentTarget.style.borderColor = "#334155"; }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ LOGIN ═══ */}
      <HelpSection
        id="login"
        title="Anmeldung"
        subtitle="Zugang zum System"
        icon="🔐"
        roles={["ALL"]}
        mockup={
          <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 24, width: 240, boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 13, fontWeight: 700, color: "#fff" }}>EM</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}>EmployeeManagement</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Anmelden um fortzufahren</div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4 }}>E-Mail</div>
                <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", fontSize: 10, color: "#64748b" }}>benutzer@firma.de</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4 }}>Passwort</div>
                <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", fontSize: 10, color: "#64748b" }}>••••••••</div>
              </div>
              <div style={{ background: "#6366f1", borderRadius: 6, padding: "7px 0", textAlign: "center", fontSize: 10, fontWeight: 600, color: "#fff" }}>Anmelden</div>

            </div>
          </div>
        }
        features={[
          "E-Mail-Adresse und Passwort eingeben und auf «Anmelden» klicken.",
          "Bei fehlgeschlagenem Login erscheint eine rote Fehlermeldung unterhalb der Eingabefelder.",
          "Das Passwort kann über das Augen-Symbol ein- und ausgeblendet werden.",
          "Nach erfolgreicher Anmeldung wird das Dashboard geöffnet.",
          "Die Sitzung bleibt bis zum manuellen Abmelden (Sidebar unten) aktiv.",
        ]}
      >
        <InfoBox color="yellow" icon="⚠️" title="Konto gesperrt?">
          Wenn ein Konto gesperrt wurde, erscheint eine Fehlermeldung. Ein Administrator muss den Account unter{" "}
          <strong style={{ color: "#f1f5f9" }}>Benutzer → Entsperren</strong> wieder freischalten.
        </InfoBox>
      </HelpSection>

      {/* ═══ DASHBOARD ═══ */}
      <HelpSection
        id="dashboard"
        title="Dashboard"
        subtitle="Übersicht & Kennzahlen"
        icon="📊"
        roles={["ALL"]}
        mockup={
          <ScreenMockup active="dashboard">
            {/* Dept filter */}
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {["Alle", "Engineering", "HR", "IT"].map((d, i) => (
                <div key={d} style={{ padding: "2px 8px", borderRadius: 10, border: `1px solid ${i === 0 ? "#6366f1" : "#334155"}`, background: i === 0 ? "rgba(99,102,241,0.12)" : "#1e293b", fontSize: 8, color: i === 0 ? "#a5b4fc" : "#64748b" }}>{d}</div>
              ))}
            </div>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <MockKpi icon="👥" value="12" label="Aktive Mitarbeiter" color="#6366f1" />
              <MockKpi icon="💰" value="840k€" label="Gehaltskosten/Jahr" color="#10b981" />
              <MockKpi icon="📅" value="3.2 J." label="Ø Betriebszugeh." color="#f59e0b" />
              <MockKpi icon="🔑" value="18/24" label="Lizenzen genutzt" color="#8b5cf6" />
            </div>
            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div style={{ background: "#0f172a", borderRadius: 6, border: "1px solid #334155", padding: 8 }}>
                <div style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, marginBottom: 6 }}>Mitarbeiter nach Abteilung</div>
                {[["Engineering", 40, "#6366f1"], ["Product", 25, "#10b981"], ["Design", 20, "#f59e0b"], ["HR", 15, "#8b5cf6"]].map(([label, pct, color]) => (
                  <MockBar key={label} label={label} pct={pct} color={color} />
                ))}
              </div>
              <div style={{ background: "#0f172a", borderRadius: 6, border: "1px solid #334155", padding: 8 }}>
                <div style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, marginBottom: 6 }}>Lizenzauslastung</div>
                {[["Microsoft 365", 85, "#f59e0b"], ["GitHub", 60, "#6366f1"], ["Figma", 40, "#10b981"]].map(([label, pct, color]) => (
                  <MockBar key={label} label={label} pct={pct} color={color} />
                ))}
              </div>
            </div>
          </ScreenMockup>
        }
        features={[
          "Oben: Abteilungsfilter — klicke auf eine Abteilung, um alle KPIs auf diese zu beschränken.",
          "KPI-Karten: Aktive Mitarbeiter, Gehaltskosten, Durchschnittliche Betriebszugehörigkeit, Lizenzauslastung.",
          "Kreisdiagramm links: Mitarbeiterverteilung nach Abteilung in Prozent.",
          "Kreisdiagramm rechts: Hardware-Status (Verfügbar / Ausgeliehen / Wartung / Ausgemustert).",
          "Balkendiagramm unten: Genutzte vs. freie Lizenzen je Software-Produkt.",
          "Alle Diagramme aktualisieren sich automatisch beim Filterumschalten.",
        ]}
      />

      {/* ═══ MITARBEITER ═══ */}
      <HelpSection
        id="employees"
        title="Mitarbeiter"
        subtitle="Stammdaten, Hardware- & Software-Zuweisungen"
        icon="👥"
        roles={["ALL", "HR", "ADMIN"]}
        mockup={
          <ScreenMockup active="employees">
            {/* Toolbar */}
            <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <div style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#64748b" }}>🔍 Name, Nummer, Abteilung suchen …</div>
              <div style={{ padding: "4px 8px", background: "#334155", borderRadius: 5, fontSize: 8, color: "#94a3b8" }}>PDF</div>
              <div style={{ padding: "4px 8px", background: "#334155", borderRadius: 5, fontSize: 8, color: "#94a3b8" }}>CSV</div>
              <div style={{ padding: "4px 10px", background: "#6366f1", borderRadius: 5, fontSize: 8, color: "#fff", fontWeight: 600 }}>＋ Mitarbeiter</div>
            </div>
            {/* Master-Detail */}
            <div style={{ display: "flex", gap: 0, background: "#1e293b", borderRadius: 6, border: "1px solid #334155", overflow: "hidden", flex: 1 }}>
              {/* Liste */}
              <div style={{ width: 140, borderRight: "1px solid #334155", overflowY: "auto" }}>
                <MockRow name="Anna Bauer" dept="Engineering" badge={{ label: "Aktiv", color: "#10b981", bg: "rgba(16,185,129,0.12)" }} />
                <MockRow name="Ben Müller" dept="Product" badge={{ label: "Aktiv", color: "#10b981", bg: "rgba(16,185,129,0.12)" }} />
                <MockRow name="Clara Schmidt" dept="HR" badge={{ label: "Inaktiv", color: "#ef4444", bg: "rgba(239,68,68,0.12)" }} />
                <MockRow name="David König" dept="IT" badge={{ label: "Aktiv", color: "#10b981", bg: "rgba(16,185,129,0.12)" }} />
              </div>
              {/* Detail */}
              <div style={{ flex: 1, padding: 10, background: "#0f172a" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6366f122", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>A</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>Anna Bauer</div>
                    <div style={{ fontSize: 9, color: "#a5b4fc" }}>Senior Developer</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    <div style={{ padding: "3px 8px", background: "#334155", borderRadius: 5, fontSize: 8, color: "#94a3b8" }}>Bearbeiten</div>
                    <div style={{ padding: "3px 8px", background: "rgba(239,68,68,0.12)", borderRadius: 5, fontSize: 8, color: "#ef4444" }}>Löschen</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                  {[["E-MAIL", "a.bauer@firma.de"], ["TELEFON", "+49 30 12345"], ["EINGESTELLT", "01.01.2022"], ["GEHALT", "85.000 €/Jahr"]].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 7, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 1 }}>{label}</div>
                      <div style={{ fontSize: 9, color: "#f1f5f9" }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>ZUGEWIESENE HARDWARE</div>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 5, padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 9, color: "#f1f5f9" }}>MacBook Pro 16"</div>
                  <div style={{ fontSize: 8, padding: "2px 6px", background: "#334155", borderRadius: 4, color: "#94a3b8" }}>Zurückgeben</div>
                </div>
              </div>
            </div>
          </ScreenMockup>
        }
        features={[
          "Linke Spalte (Master): Liste aller Mitarbeiter, filterbar per Suchfeld und sortierbar per Klick auf die Sortier-Schaltflächen.",
          "Rechte Spalte (Detail): Vollständige Stammdaten des ausgewählten Mitarbeiters inkl. Adresse.",
          "Hardware-Zuweisung: Im Detailbereich «+ Neue Hardware» → Modell wählen → konkretes Gerät (Asset-Tag) auswählen.",
          "Hardware-Rückgabe: Im Detailbereich das ausgeliehene Gerät per «Zurückgeben»-Button zurücknehmen.",
          "Hardware-Historie: Im Detailbereich «Historie»-Button zeigt alle abgeschlossenen Ausleihen.",
          "Software-Zuweisung: Im Detailbereich «+ Neue Software» → Lizenz auswählen → Zuweisung bestätigen.",
          "Software-Entzug: Per «Entziehen»-Button neben der zugewiesenen Lizenz.",
          "Mehrfachauswahl: Checkboxen in der Liste → Batch-Aktion «Deaktivieren» für mehrere Mitarbeiter gleichzeitig.",
          "PDF-Export: Druckt einen formatierten Mitarbeiter-Bericht.",
          "CSV-Export: Exportiert alle Mitarbeiterdaten als CSV-Datei.",
          "CSV-Import: Lädt Mitarbeiterdaten aus einer CSV-Vorlage in die Datenbank.",
        ]}
      >
        <InfoBox color="indigo" icon="💡" title="Mitarbeiter anlegen">
          Pflichtfelder: <strong style={{ color: "#f1f5f9" }}>Mitarbeiter-Nr., Vorname, Nachname, E-Mail, Einstellungsdatum.</strong>{" "}
          Optional kann ein Profilfoto (JPG/PNG/GIF/WebP, max. 5 MB) hochgeladen werden.
        </InfoBox>
        <InfoBox color="green" icon="✅" title="Rollen-Hinweis">
          <strong style={{ color: "#f1f5f9" }}>HR und ADMIN</strong> können Mitarbeiter anlegen, bearbeiten und löschen.{" "}
          <strong style={{ color: "#f1f5f9" }}>IT und ADMIN</strong> können Hardware und Software zuweisen.{" "}
          <strong style={{ color: "#f1f5f9" }}>VIEWER</strong> hat nur Lesezugriff.
        </InfoBox>
      </HelpSection>

      {/* ═══ HARDWARE ═══ */}
      <HelpSection
        id="hardware"
        title="Hardware"
        subtitle="IT-Asset-Verwaltung, Ausleihe und Rückgabe"
        icon="💻"
        roles={["ALL", "IT", "ADMIN"]}
        mockup={
          <ScreenMockup active="hardware">
            {/* Toolbar */}
            <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#64748b" }}>🔍 Hardware suchen …</div>
              {["Alle", "Verfügbar", "Ausgeliehen"].map((f, i) => (
                <div key={f} style={{ padding: "3px 8px", borderRadius: 10, border: `1px solid ${i === 0 ? "#6366f1" : "#334155"}`, fontSize: 8, color: i === 0 ? "#a5b4fc" : "#64748b", background: i === 0 ? "rgba(99,102,241,0.12)" : "#1e293b" }}>{f}</div>
              ))}
              <div style={{ padding: "4px 10px", background: "#6366f1", borderRadius: 5, fontSize: 8, color: "#fff", fontWeight: 600 }}>＋ Hardware</div>
            </div>
            {/* Tabelle */}
            <div style={{ background: "#1e293b", borderRadius: 6, border: "1px solid #334155", overflow: "hidden" }}>
              <div style={{ background: "#0f172a", display: "grid", gridTemplateColumns: "24px 50px 1fr 70px 80px 100px", gap: 6, padding: "5px 10px", borderBottom: "1px solid #334155" }}>
                {["", "Bst.", "Modell", "Kateg.", "Hersteller", "Aktionen"].map((h) => (
                  <div key={h} style={{ fontSize: 7, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              <MockHwRow emoji="💻" name='MacBook Pro 16"' avail={3} total={5} category="LAPTOP" />
              <MockHwRow emoji="🖥️" name="Dell 4K Monitor" avail={0} total={4} category="MONITOR" />
              <MockHwRow emoji="📱" name="iPad Pro 12.9" avail={2} total={3} category="TABLET" />
              <MockHwRow emoji="📱" name="iPhone 15 Pro" avail={1} total={2} category="PHONE" />
            </div>
          </ScreenMockup>
        }
        features={[
          "Statusfilter: Alle / Verfügbar / Ausgeliehen — filtert die Tabelle nach Geräte-Verfügbarkeit.",
          "Bestand (grün): Verfügbare Einheiten. Bestand (orange): Alle Einheiten ausgeliehen.",
          "Ausleihe: «Ausleihe»-Button öffnet einen Dialog → Gerät (Asset-Tag) wählen → Mitarbeiter wählen → optional Rückgabedatum und Notiz → «Ausleihen».",
          "Rückgabe: Im selben Dialog Tab «Zurückgeben» → ausgeliehenes Gerät wählen → optional Zustandsnotiz → «Zurückgeben».",
          "Geräte verwalten: «Geräte»-Button öffnet die Einheitenliste mit Asset-Tags, Seriennummern, Status, Garantie.",
          "Neue Einheit hinzufügen: Im Geräte-Dialog «+ Gerät hinzufügen» → Seriennummer, Kaufdatum, Garantiedatum.",
          "Hardware anlegen: «＋ Hardware»-Button → Modell-Infos + beliebig viele Einheiten (Seriennummern) in einem Schritt.",
          "Hardware bearbeiten: Nur Modell-Metadaten (Name, Kategorie, Hersteller, Modell, Notizen) änderbar.",
          "PDF- und CSV-Export: Hardware-Inventarliste als Datei herunterladen.",
          "CSV-Import: Mehrere Hardware-Datensätze auf einmal einlesen.",
        ]}
      >
        <InfoBox color="blue" icon="ℹ️" title="Konzept: Modell vs. Einheit">
          Hardware wird in zwei Ebenen verwaltet: Ein <strong style={{ color: "#f1f5f9" }}>Modell</strong> (z.B. «MacBook Pro 16») fasst mehrere{" "}
          <strong style={{ color: "#f1f5f9" }}>physische Einheiten</strong> zusammen. Jede Einheit hat einen eindeutigen{" "}
          <strong style={{ color: "#f1f5f9" }}>Asset-Tag</strong> (automatisch vergeben) und optional eine Seriennummer.{" "}
          Ausgeliehen wird immer eine konkrete Einheit, nicht das Modell.
        </InfoBox>
        <InfoBox color="indigo" icon="💡" title="Rollen-Hinweis">
          <strong style={{ color: "#f1f5f9" }}>IT und ADMIN</strong> können Hardware anlegen, bearbeiten, löschen und Ausleihen verwalten.{" "}
          <strong style={{ color: "#f1f5f9" }}>VIEWER und HR</strong> sehen die Tabelle nur lesend.
        </InfoBox>
      </HelpSection>

      {/* ═══ SOFTWARE ═══ */}
      <HelpSection
        id="software"
        title="Software & Lizenzen"
        subtitle="Lizenz-Karten, Kapazität und Zuweisung"
        icon="🔑"
        roles={["ALL", "IT", "ADMIN"]}
        mockup={
          <ScreenMockup active="software">
            {/* Toolbar */}
            <div style={{ display: "flex", gap: 5, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#64748b" }}>🔍 Software suchen …</div>
              {["Alle", "Produktivität", "Entwicklung", "Design"].map((c, i) => (
                <div key={c} style={{ padding: "2px 7px", borderRadius: 10, border: `1px solid ${i === 0 ? "#6366f1" : "#334155"}`, fontSize: 8, color: i === 0 ? "#a5b4fc" : "#64748b", background: i === 0 ? "rgba(99,102,241,0.12)" : "#1e293b" }}>{c}</div>
              ))}
              <div style={{ padding: "4px 10px", background: "#6366f1", borderRadius: 5, fontSize: 8, color: "#fff", fontWeight: 600 }}>＋ Software</div>
            </div>
            {/* Karten */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <MockSwCard emoji="📊" name="Microsoft 365" vendor="Microsoft" used={18} total={20} color="#3b82f6" />
              <MockSwCard emoji="🛠️" name="GitHub Enterprise" vendor="GitHub" used={12} total={20} color="#8b5cf6" />
              <MockSwCard emoji="🎨" name="Figma" vendor="Figma Inc." used={8} total={10} color="#ec4899" />
              <MockSwCard emoji="📊" name="Jira" vendor="Atlassian" used={5} total={15} color="#3b82f6" />
            </div>
          </ScreenMockup>
        }
        features={[
          "Kategoriefilter: Alle / Produktivität / Entwicklung / Design / Betriebssystem.",
          "Lizenz-Karten: Jede Software wird als Karte angezeigt mit Auslastungsbalken (genutzt/gesamt).",
          "Warnung (orange): Wenn ≥ 85 % der Lizenzen vergeben sind, erscheint ein Warnhinweis.",
          "Abgelaufen (rot): Lizenzen mit überschrittenem Erneuerungsdatum können nicht mehr zugewiesen werden.",
          "Lizenz zuweisen: «Zuweisen»-Button → Mitarbeiter aus Dropdown wählen → bestätigen.",
          "Lizenz entziehen: Im Mitarbeiter-Detailbereich (Seite Mitarbeiter) per «Entziehen»-Button.",
          "Software anlegen: Name, Hersteller, Version, Kategorie, Lizenztyp, Anzahl Lizenzen, Kosten/Lizenz, Erneuerungsdatum.",
          "Software bearbeiten: Alle Felder nachträglich änderbar, auch Lizenzanzahl erhöhen/senken.",
          "Lizenz-Audit als PDF: Kompakte Übersicht aller Lizenzen mit Auslastung und Kosten.",
          "CSV-Export und -Import für Massenverwaltung.",
        ]}
      >
        <InfoBox color="yellow" icon="⚠️" title="Lizenz-Kapazität fast erschöpft">
          Wenn der orangene Warnbalken erscheint (≥ 85 %), sollte zeitnah die Lizenzanzahl erhöht oder eine Lizenz
          von einem Mitarbeiter entzogen werden. Neue Zuweisungen sind bis zur Kapazitätsgrenze möglich.
        </InfoBox>
      </HelpSection>

      {/* ═══ ADMIN ═══ */}
      {isAdmin && (
        <HelpSection
          id="admin"
          title="Benutzer"
          subtitle="Konten anlegen, Rollen vergeben, Zugang sperren"
          icon="⚙️"
          roles={["ADMIN"]}
          mockup={
            <ScreenMockup active="admin">
              {/* Rollenkarten */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 8 }}>
                {[["A","Admin","#ef4444","rgba(239,68,68,0.12)",1], ["H","HR","#f59e0b","rgba(245,158,11,0.12)",2], ["I","IT","#3b82f6","rgba(59,130,246,0.12)",3], ["V","Viewer","#64748b","rgba(100,116,139,0.12)",6]].map(([icon, label, color, bg, count]) => (
                  <div key={label} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>{count}</div>
                      <div style={{ fontSize: 8, color: "#64748b" }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Tabelle */}
              <div style={{ background: "#1e293b", borderRadius: 6, border: "1px solid #334155", overflow: "hidden" }}>
                <div style={{ background: "#0f172a", padding: "5px 10px", borderBottom: "1px solid #334155", display: "flex", gap: 6 }}>
                  {["Benutzer", "Rolle", "Status", "Aktionen"].map((h) => (
                    <div key={h} style={{ fontSize: 7, color: "#64748b", fontWeight: 600, textTransform: "uppercase", flex: h === "Benutzer" ? 2 : 1 }}>{h}</div>
                  ))}
                </div>
                <MockUserRow name="Alice Admin" email="alice@firma.de" role="Admin" rc={{ color: "#ef4444", bg: "rgba(239,68,68,0.12)" }} status={true} />
                <MockUserRow name="Ben HR" email="ben@firma.de" role="HR" rc={{ color: "#f59e0b", bg: "rgba(245,158,11,0.12)" }} status={true} />
                <MockUserRow name="Clara IT" email="clara@firma.de" role="IT" rc={{ color: "#3b82f6", bg: "rgba(59,130,246,0.12)" }} status={false} />
              </div>
            </ScreenMockup>
          }
          features={[
            "Rollenkarten oben: Anzahl der Benutzer je Rolle auf einen Blick.",
            "Benutzer anlegen: «+ Benutzer» → E-Mail, Anzeigename, Rolle und initiales Passwort (min. 8 Zeichen) eingeben.",
            "Rolle ändern: Dropdown in der Tabellenspalte «Rolle» direkt klicken — kein Speichern nötig.",
            "Benutzer bearbeiten: «Bearbeiten»-Button → Anzeigename und E-Mail ändern.",
            "Account sperren/entsperren: «Sperren»-Button verhindert die Anmeldung; «Entsperren» hebt die Sperre auf.",
            "Passwort zurücksetzen: «PW Reset»-Button → neues Passwort (min. 8 Zeichen) zweimal eingeben.",
            "Benutzer löschen: Nur möglich, wenn der Account bereits gesperrt ist (Sicherheitsstufe).",
            "Eigener Account: Eigene Rolle und eigener Account können nicht gesperrt oder gelöscht werden.",
            "System-Admin (ID 1): Kann nicht gelöscht oder gesperrt werden.",
          ]}
        >
          <InfoBox color="red" icon="🚨" title="Sicherheitshinweis">
            Die Rolle <strong style={{ color: "#f1f5f9" }}>ADMIN</strong> verleiht Vollzugriff auf alle Daten und Funktionen inkl. Benutzerverwaltung.
            Vergib diese Rolle nur an vertrauenswürdige Personen.
          </InfoBox>
        </HelpSection>
      )}

      {/* ═══ AUDIT-LOG ═══ */}
      {isAdmin && (
        <HelpSection
          id="audit"
          title="Audit-Log"
          subtitle="Nachvollziehbare Änderungshistorie — wer hat was wann geändert"
          icon="📋"
          roles={["ADMIN"]}
          mockup={
            <ScreenMockup active="audit">
              <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                🔍 Benutzer oder Pfad suchen …
              </div>
              <div style={{ background: "#1e293b", borderRadius: 6, border: "1px solid #334155", overflow: "hidden" }}>
                <div style={{ background: "#0f172a", padding: "5px 10px", borderBottom: "1px solid #334155", display: "flex", gap: 8 }}>
                  {["Zeitpunkt", "Benutzer", "Aktion", "Pfad", "Status", "IP"].map((h) => (
                    <div key={h} style={{ fontSize: 7, color: "#64748b", fontWeight: 600, textTransform: "uppercase", flex: 1 }}>{h}</div>
                  ))}
                </div>
                <MockAuditRow time="16.04. 09:12" user="alice@firma.de" action="POST" path="/employees" status={201} />
                <MockAuditRow time="16.04. 09:08" user="ben@firma.de" action="PUT" path="/employees/5" status={200} />
                <MockAuditRow time="16.04. 08:55" user="clara@firma.de" action="DELETE" path="/hardware/3" status={204} />
                <MockAuditRow time="16.04. 08:41" user="alice@firma.de" action="POST" path="/software/2/assign/7" status={200} />
                <MockAuditRow time="16.04. 08:30" user="dave@firma.de" action="PUT" path="/employees/3" status={403} />
              </div>
            </ScreenMockup>
          }
          features={[
            "Zeigt alle schreibenden API-Operationen (Erstellen, Ändern, Löschen) mit Zeitstempel.",
            "Spalten: Zeitpunkt, Benutzer (E-Mail), Aktion (Erstellt/Geändert/Gelöscht), API-Pfad, HTTP-Status, IP-Adresse.",
            "Suchfeld: Filtert nach Benutzername oder API-Pfad in Echtzeit (300 ms Verzögerung).",
            "Farbige Status-Badges: Grün = erfolgreich (2xx), Rot = Fehler (4xx/5xx).",
            "Paginierung: 20 Einträge pro Seite, navigierbar über Seitenzahlen.",
            "Schreibgeschützt — keine Einträge löschbar.",
          ]}
        >
          <InfoBox color="blue" icon="ℹ️">
            Der Audit-Log dient der Compliance und Fehlersuche. Er zeigt ausschließlich Mutationen — reine Lesezugriffe (GET) werden nicht protokolliert.
          </InfoBox>
        </HelpSection>
      )}

      {/* ═══ BENACHRICHTIGUNGEN ═══ */}
      {isAdmin && (
        <HelpSection
          id="notify"
          title="Benachrichtigungen"
          subtitle="E-Mail-Einstellungen und automatische Warnmeldungen"
          icon="📧"
          roles={["ADMIN"]}
          mockup={
            <ScreenMockup active="notify">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Status-Karte */}
                <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9" }}>E-Mail-Benachrichtigungen</div>
                      <div style={{ fontSize: 8, color: "#475569" }}>Tägliche Prüfung um 08:00 Uhr</div>
                    </div>
                    <div style={{ fontSize: 8, padding: "2px 8px", borderRadius: 10, background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 600 }}>Aktiv</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[["SMTP-Server", "smtp.gmail.com"], ["Empfänger", "admin@firma.de"], ["Garantie-Warnung", "30 Tage vorher"], ["Lizenz-Warnung", "30 Tage vorher"]].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: 7, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 9, color: "#f1f5f9", fontFamily: "monospace" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Test-Mail */}
                <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>Test-E-Mail senden</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 5, padding: "4px 8px", fontSize: 9, color: "#64748b" }}>name@firma.de</div>
                    <div style={{ padding: "4px 10px", background: "#6366f1", borderRadius: 5, fontSize: 8, color: "#fff", fontWeight: 600 }}>Test senden</div>
                  </div>
                </div>
              </div>
            </ScreenMockup>
          }
          features={[
            "Zeigt die aktuelle E-Mail-Konfiguration: SMTP-Server, Benutzername, Empfänger-Adresse.",
            "Schwellenwerte für automatische Benachrichtigungen: Garantie-Ablauf, Lizenz-Erneuerung, Hardware-Rückgabe.",
            "Test-Mail: Beliebige E-Mail-Adresse eingeben und eine Test-Mail auslösen — prüft SMTP-Erreichbarkeit.",
            "Automatische Benachrichtigungen werden täglich um 08:00 Uhr geprüft und versendet.",
          ]}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "🔧", title: "Garantie-Ablauf", desc: "Hardware-Geräte, deren Garantie in den konfigurierten Tagen abläuft. Empfänger: Admin." },
              { icon: "🔑", title: "Lizenz-Erneuerung", desc: "Software-Lizenzen, die bald erneuert werden müssen. Empfänger: Admin." },
              { icon: "📦", title: "Hardware-Rückgabe", desc: "Ausleihen mit geplanter Rückgabe in den nächsten N Tagen. Empfänger: Admin-Sammelmail + betroffener Mitarbeiter direkt." },
            ].map((n) => (
              <InfoBox key={n.title} color="indigo" icon={n.icon} title={n.title}>{n.desc}</InfoBox>
            ))}
          </div>
          <InfoBox color="blue" icon="ℹ️" title="Konfiguration ändern">
            SMTP-Zugangsdaten und Schwellenwerte werden über die Server-Umgebungsvariablen (`.env`-Datei auf dem VPS) konfiguriert —
            nicht über die Benutzeroberfläche. Bitte den System-Administrator kontaktieren.
          </InfoBox>
        </HelpSection>
      )}

      {/* ═══ ROLLEN ═══ */}
      <div id="roles" style={{ scrollMarginTop: 20 }}>
        <HelpSection
          id="roles-section"
          title="Rollen & Berechtigungen"
          subtitle="Wer darf was — Übersicht aller Zugriffsebenen"
          icon="🛡️"
          roles={["ALL"]}
          mockup={null}
          features={null}
        >
          <RoleTable />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
            <InfoBox color="indigo" icon="💡" title="Rollen-Vergabe">
              Rollen können nur von einem <strong style={{ color: "#f1f5f9" }}>ADMIN</strong> unter{" "}
              <strong style={{ color: "#f1f5f9" }}>Benutzer → Rolle</strong> geändert werden.
            </InfoBox>
            <InfoBox color="green" icon="✅" title="Passwort ändern">
              Jeder Benutzer kann sein Passwort über einen Admin-PW-Reset ändern lassen. Ein eigenes Passwort-Änderungsformular ist in Planung.
            </InfoBox>
          </div>
        </HelpSection>
      </div>

      {/* ═══ ALLGEMEINE TIPPS ═══ */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif", marginBottom: 16 }}>
          Allgemeine Tipps
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <InfoBox color="indigo" icon="🌓" title="Dark / Light Mode">
            Oben rechts im Header das Sonne/Mond-Symbol klicken, um zwischen Dark und Light Mode zu wechseln.
          </InfoBox>
          <InfoBox color="blue" icon="☰" title="Sidebar ein-/ausklappen">
            Das Hamburger-Symbol (☰) oben links im Header klappt die Sidebar auf Icons zusammen — mehr Platz für Inhalte.
          </InfoBox>
          <InfoBox color="green" icon="🔔" title="Toast-Benachrichtigungen">
            Aktionen (Speichern, Löschen, Zuweisen …) werden mit einer grünen oder roten Meldung unten rechts quittiert.
            Diese verschwindet automatisch nach 3 Sekunden.
          </InfoBox>
          <InfoBox color="yellow" icon="📄" title="PDF-Berichte">
            Auf den Seiten Mitarbeiter, Hardware und Software steht ein PDF-Button zur Verfügung.
            Der Bericht wird direkt im Browser geöffnet oder heruntergeladen.
          </InfoBox>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: 11, color: "#334155", fontFamily: "'DM Sans', sans-serif", paddingBottom: 8 }}>
        EmployeeManagement · Benutzerhandbuch · Stand April 2026
      </div>
    </div>
  );
}

export default HelpPage;
