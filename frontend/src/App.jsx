import { useState, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider, useTheme } from "./context/ThemeContext.jsx";
import Toast from "./components/Toast.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import HardwarePage from "./pages/HardwarePage.jsx";
import SoftwarePage from "./pages/SoftwarePage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import AuditLogPage from "./pages/AuditLogPage.jsx";

// ── SVG Icons ────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9"/>
    <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9"/>
    <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9"/>
    <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9"/>
  </svg>
);

const IconEmployees = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="8" cy="6" r="3" fill="currentColor" opacity="0.9"/>
    <path d="M2 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <circle cx="15" cy="7" r="2.2" fill="currentColor" opacity="0.6"/>
    <path d="M17 16c0-2.21-1.343-4.1-3.25-4.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6"/>
  </svg>
);

const IconHardware = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/>
    <path d="M6 18h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M10 14v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="10" cy="9" r="1.5" fill="currentColor" opacity="0.7"/>
  </svg>
);

const IconSoftware = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/>
    <path d="M2 16h16" stroke="currentColor" strokeWidth="1.4" opacity="0.4"/>
    <path d="M6 7l2.5 2.5L6 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M11 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const IconAdmin = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.8"/>
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const NAV = [
  { id: "dashboard", label: "Dashboard",          Icon: IconDashboard },
  { id: "employees", label: "Mitarbeiter",         Icon: IconEmployees },
  { id: "hardware",  label: "Hardware",            Icon: IconHardware  },
  { id: "software",  label: "Software & Lizenzen", Icon: IconSoftware  },
  { id: "admin",     label: "Administration",      Icon: IconAdmin     },
  { id: "audit",     label: "Audit-Log",           Icon: IconAdmin     },
];

const PAGE_SUBTITLES = {
  dashboard: "Übersicht & Kennzahlen",
  employees: "Mitarbeiterverwaltung",
  hardware:  "Hardware-Assets",
  software:  "Software & Lizenzen",
  admin:     "Benutzerverwaltung",
  audit:     "Wer hat was wann geändert",
};

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  useState(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  });
  return isMobile;
}

function NavItem({ item, active, onClick, collapsed }) {
  const [hovered, setHovered] = useState(false);
  const { Icon } = item;

  let bg = "transparent";
  let color = "#64748b";
  if (active) {
    bg = "rgba(99,102,241,0.12)";
    color = "#a5b4fc";
  } else if (hovered) {
    bg = "rgba(255,255,255,0.04)";
    color = "#94a3b8";
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: active ? "6px 12px 6px 9px" : "6px 12px",
        borderRadius: "8px",
        border: "none",
        borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 2,
        marginLeft: 12,
        marginRight: 12,
        width: "calc(100% - 24px)",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        fontFamily: "'DM Sans', sans-serif",
        textAlign: "left",
        transition: "all 150ms ease",
      }}
    >
      <Icon />
      {!collapsed && item.label}
    </button>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const { mode, toggle, t } = useTheme();
  const [page, setPage]   = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (!user) return <LoginPage />;

  const pages = {
    dashboard: <Dashboard />,
    employees: <EmployeesPage toast={showToast} />,
    hardware:  <HardwarePage toast={showToast} />,
    software:  <SoftwarePage toast={showToast} />,
    admin:     <AdminPage    toast={showToast} />,
    audit:     <AuditLogPage />,
  };

  const currentNav = NAV.find((n) => n.id === page);

  return (
    <div style={{ display: "flex", height: "100vh", background: t.bg, overflow: "hidden", color: t.text }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />
      )}

      {/* ── Sidebar ── */}
      <div
        style={{
          width: isMobile ? 260 : (sidebarOpen ? 260 : 64),
          background: t.bgCard,
          borderRight: `1px solid ${t.border}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100vh",
          transition: "width 200ms ease, transform 200ms ease",
          ...(isMobile ? {
            position: "fixed", zIndex: 100, left: 0, top: 0,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          } : {}),
        }}
      >
        {/* Logo area */}
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Sora', sans-serif",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            EM
          </div>
          {(sidebarOpen || isMobile) && (
            <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14, fontFamily: "'Sora', sans-serif", letterSpacing: "0.1px" }}>
              EmployeeManagement
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 4 }}>
          {NAV.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={page === item.id}
              collapsed={!sidebarOpen && !isMobile}
              onClick={() => { setPage(item.id); if (isMobile) setSidebarOpen(false); }}
            />
          ))}
        </nav>

        {/* User section */}
        <div
          style={{
            margin: "0 12px 16px",
            padding: "12px",
            borderTop: "1px solid #334155",
            paddingTop: 16,
            display: (!sidebarOpen && !isMobile) ? "none" : "block",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(99,102,241,0.2)",
                border: "1px solid rgba(99,102,241,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                color: "#a5b4fc",
                fontFamily: "'Sora', sans-serif",
                flexShrink: 0,
              }}
            >
              {user.email[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: "#f1f5f9",
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {user.email}
              </div>
              <button
                onClick={logout}
                style={{
                  color: "#64748b",
                  fontSize: 11,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "color 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: t.bg,
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: isMobile ? "12px 16px" : "16px 32px",
            background: t.bg,
            borderBottom: `1px solid ${t.borderLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: 12,
          }}
        >
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{
              background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
              padding: 4, fontSize: 20, lineHeight: 1, flexShrink: 0,
            }}
            title={sidebarOpen ? "Sidebar einklappen" : "Sidebar ausklappen"}
          >
            {sidebarOpen ? "\u2630" : "\u2630"}
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: "#f1f5f9",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {currentNav?.label}
            </h1>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              {PAGE_SUBTITLES[page]}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <button
              onClick={toggle}
              title={mode === "dark" ? "Light Mode" : "Dark Mode"}
              style={{
                background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
                cursor: "pointer", padding: "6px 10px", fontSize: 16, lineHeight: 1, color: t.textMuted,
                transition: "all 150ms ease",
              }}
            >
              {mode === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
            </button>
            {!isMobile && (
              <span style={{ fontSize: 12, color: t.textFaint, fontFamily: "'DM Sans', sans-serif" }}>
                {new Date().toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "16px 12px" : "24px 32px" }}>
          {pages[page]}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ThemeProvider>
  );
}
