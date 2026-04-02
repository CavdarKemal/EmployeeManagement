import { useState, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { T } from "./components/tokens.js";
import Toast from "./components/Toast.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import HardwarePage from "./pages/HardwarePage.jsx";
import SoftwarePage from "./pages/SoftwarePage.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard",          icon: "📊" },
  { id: "employees", label: "Mitarbeiter",         icon: "👥" },
  { id: "hardware",  label: "Hardware",            icon: "💻" },
  { id: "software",  label: "Software & Lizenzen", icon: "🔑" },
];

function Shell() {
  const { user, logout } = useAuth();
  const [page, setPage]   = useState("dashboard");
  const [toast, setToast] = useState(null);

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
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: "'Inter',-apple-system,sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: T.primaryDark, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 16px 18px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🏢
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>EmployeeManagement</div>
              <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10 }}>Asset Management</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 9, border: "none",
                background: page === item.id ? "rgba(255,255,255,.14)" : "transparent",
                color: page === item.id ? "#fff" : "rgba(255,255,255,.5)",
                display: "flex", alignItems: "center", gap: 10, marginBottom: 2,
                cursor: "pointer", fontSize: 13, fontWeight: page === item.id ? 700 : 400,
                textAlign: "left", transition: "all .15s",
              }}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div style={{ margin: "0 10px 12px", padding: "10px 12px", background: "rgba(255,255,255,.07)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
            {user.email[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </div>
            <button
              onClick={logout}
              style={{ color: "rgba(255,255,255,.4)", fontSize: 10, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", background: "#fff", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>
            {NAV.find((n) => n.id === page)?.icon} {NAV.find((n) => n.id === page)?.label}
          </h1>
          <span style={{ fontSize: 12, color: T.textMuted }}>
            {new Date().toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {pages[page]}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
