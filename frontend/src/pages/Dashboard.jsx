import { useState, useEffect } from "react";
import api from "../api/index.js";
import { T, DEPT } from "../components/tokens.js";
import Card from "../components/Card.jsx";
import Spinner from "../components/Spinner.jsx";

const KPI_COLORS = {
  employees: { accent: "#6366f1", bg: "rgba(99,102,241,0.12)",  icon: "👥" },
  available: { accent: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: "✅" },
  loaned:    { accent: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "📤" },
  licenses:  { accent: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  icon: "🔑" },
};

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [hardware, setHardware]   = useState([]);
  const [software, setSoftware]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/employees?size=200").then((d) => { if (d?.content) setEmployees(d.content); }),
      api.get("/hardware?size=200").then((d) => { if (d?.content) setHardware(d.content); }),
      api.get("/software?size=200").then((d) => { if (d?.content) setSoftware(d.content); }),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Dashboard laden …" />;

  const active    = employees.filter((e) => e.active).length;
  const available = hardware.filter((h) => h.status === "AVAILABLE").length;
  const loaned    = hardware.filter((h) => h.status === "LOANED").length;
  const totalLic  = software.reduce((a, s) => a + (s.totalLicenses || 0), 0);
  const usedLic   = software.reduce((a, s) => a + (s.usedLicenses || 0), 0);

  const stats = [
    { key: "employees", label: "Aktive Mitarbeiter",  value: active,                    ...KPI_COLORS.employees },
    { key: "available", label: "Hardware verfügbar",  value: available,                 ...KPI_COLORS.available },
    { key: "loaned",    label: "Hardware ausgeliehen", value: loaned,                   ...KPI_COLORS.loaned    },
    { key: "licenses",  label: "Lizenzen in Nutzung", value: `${usedLic}/${totalLic}`,  ...KPI_COLORS.licenses  },
  ];

  const deptCounts = employees.reduce(
    (a, e) => ({ ...a, [e.department]: (a[e.department] || 0) + 1 }),
    {}
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {stats.map((s) => (
          <Card key={s.key} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#f1f5f9",
                  fontFamily: "'Sora', sans-serif",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginTop: 4,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {s.label}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Department bars */}
        <Card>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}>
              Mitarbeiter nach Abteilung
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              Verteilung nach Organisationseinheit
            </div>
          </div>
          {Object.entries(deptCounts).map(([dept, count]) => {
            const pct = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
            return (
              <div key={dept} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ color: "#f1f5f9" }}>{dept}</span>
                  <span style={{ color: "#94a3b8", fontWeight: 500 }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: "#334155", borderRadius: "4px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: DEPT[dept] || "#6366f1", borderRadius: "4px", transition: "width 300ms ease" }} />
                </div>
              </div>
            );
          })}
          {Object.keys(deptCounts).length === 0 && (
            <div style={{ fontSize: 13, color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>Keine Daten vorhanden</div>
          )}
        </Card>

        {/* License bars */}
        <Card>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}>
              Lizenzauslastung
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              Aktive Lizenzen im Überblick
            </div>
          </div>
          {software.map((sw) => {
            const total = sw.totalLicenses || 1;
            const used = sw.usedLicenses || 0;
            const pct = Math.round((used / total) * 100);
            const high = pct >= 85;
            const barColor = high ? "#f59e0b" : "#6366f1";
            return (
              <div key={sw.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ color: "#f1f5f9", fontWeight: 500 }}>{sw.name}</span>
                  <span style={{ color: high ? "#f59e0b" : "#94a3b8", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    {used}/{total}
                  </span>
                </div>
                <div style={{ height: 8, background: "#334155", borderRadius: "4px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "4px", transition: "width 300ms ease" }} />
                </div>
              </div>
            );
          })}
          {software.length === 0 && (
            <div style={{ fontSize: 13, color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>Keine Software vorhanden</div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
