import { useState, useEffect } from "react";
import api from "../api/index.js";
import { T, DEPT } from "../components/tokens.js";
import Card from "../components/Card.jsx";
import Spinner from "../components/Spinner.jsx";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const KPI_COLORS = {
  employees: { accent: "#6366f1", bg: "rgba(99,102,241,0.12)", icon: "👥" },
  available: { accent: "#10b981", bg: "rgba(16,185,129,0.12)", icon: "✅" },
  loaned:    { accent: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "📤" },
  licenses:  { accent: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: "🔑" },
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];
const HW_STATUS_COLORS = { AVAILABLE: "#10b981", LOANED: "#f59e0b", MAINTENANCE: "#3b82f6", RETIRED: "#64748b" };
const HW_STATUS_LABELS = { AVAILABLE: "Verfügbar", LOANED: "Ausgeliehen", MAINTENANCE: "Wartung", RETIRED: "Ausgemustert" };

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

  const [filterDept, setFilterDept] = useState("ALL");

  if (loading) return <Spinner text="Dashboard laden …" />;

  const allDepts = [...new Set(employees.map((e) => e.department).filter(Boolean))].sort();
  const filteredEmps = filterDept === "ALL" ? employees : employees.filter((e) => e.department === filterDept);

  const active    = filteredEmps.filter((e) => e.active).length;
  const totalLic  = software.reduce((a, s) => a + (s.totalLicenses || 0), 0);
  const usedLic   = software.reduce((a, s) => a + (s.usedLicenses || 0), 0);
  const totalSalary = filteredEmps.filter((e) => e.active).reduce((a, e) => a + (e.salary || 0), 0);
  const avgTenure = (() => {
    const activeEmps = filteredEmps.filter((e) => e.active && e.hireDate);
    if (activeEmps.length === 0) return 0;
    const now = new Date();
    const totalYears = activeEmps.reduce((a, e) => a + (now - new Date(e.hireDate)) / (365.25 * 86400000), 0);
    return (totalYears / activeEmps.length).toFixed(1);
  })();

  const stats = [
    { key: "employees", label: filterDept === "ALL" ? "Aktive Mitarbeiter" : `Mitarbeiter ${filterDept}`, value: active, ...KPI_COLORS.employees },
    { key: "salary", label: "Gehaltskosten/Jahr", value: `${(totalSalary / 1000).toFixed(0)}k €`, accent: "#10b981", bg: "rgba(16,185,129,0.12)", icon: "💰" },
    { key: "tenure", label: "Ø Betriebszugeh.", value: `${avgTenure} J.`, accent: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "📅" },
    { key: "licenses", label: "Lizenzen in Nutzung", value: `${usedLic}/${totalLic}`, ...KPI_COLORS.licenses },
  ];

  // Chart data
  const deptData = Object.entries(
    employees.reduce((a, e) => ({ ...a, [e.department || "Ohne"]: (a[e.department || "Ohne"] || 0) + 1 }), {})
  ).map(([name, value]) => ({ name, value }));

  const hwStatusData = Object.entries(
    hardware.flatMap((h) => h.units || []).reduce((a, u) => ({ ...a, [u.status]: (a[u.status] || 0) + 1 }), {})
  ).map(([status, count]) => ({ name: HW_STATUS_LABELS[status] || status, value: count, fill: HW_STATUS_COLORS[status] || "#94a3b8" }));

  const licenseData = software.map((sw) => ({
    name: sw.name.length > 15 ? sw.name.substring(0, 15) + "…" : sw.name,
    Genutzt: sw.usedLicenses || 0,
    Frei: (sw.totalLicenses || 0) - (sw.usedLicenses || 0),
  }));

  const tooltipStyle = { contentStyle: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }, itemStyle: { color: "#f1f5f9" } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Department Filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["ALL", ...allDepts].map((d) => {
          const isActive = filterDept === d;
          return (
            <button key={d} onClick={() => setFilterDept(d)} style={{
              padding: "7px 14px", borderRadius: "20px",
              border: `1px solid ${isActive ? "#6366f1" : "#334155"}`,
              background: isActive ? "rgba(99,102,241,0.12)" : "#1e293b",
              color: isActive ? "#a5b4fc" : "#64748b", fontSize: 12,
              fontWeight: isActive ? 600 : 400, fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer", transition: "all 150ms ease",
            }}>{d === "ALL" ? "Alle Abteilungen" : d}</button>
          );
        })}
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {stats.map((s) => (
          <Card key={s.key} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row 1: Pie charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Department Pie */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif", marginBottom: 4 }}>
            Mitarbeiter nach Abteilung
          </div>
          <div style={{ fontSize: 12, color: "#475569", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
            Verteilung nach Organisationseinheit
          </div>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                  {deptData.map((_, i) => <Cell key={i} fill={Object.values(DEPT)[i] || PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: 13, color: "#475569", fontFamily: "'DM Sans', sans-serif", padding: 40, textAlign: "center" }}>Keine Daten</div>
          )}
        </Card>

        {/* Hardware Status Pie */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif", marginBottom: 4 }}>
            Hardware nach Status
          </div>
          <div style={{ fontSize: 12, color: "#475569", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
            Verfügbarkeit der Geräte
          </div>
          {hwStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={hwStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                  {hwStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: 13, color: "#475569", fontFamily: "'DM Sans', sans-serif", padding: 40, textAlign: "center" }}>Keine Daten</div>
          )}
        </Card>
      </div>

      {/* Charts row 2: License bar chart */}
      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif", marginBottom: 4 }}>
          Lizenzauslastung
        </div>
        <div style={{ fontSize: 12, color: "#475569", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
          Genutzte vs. freie Lizenzen pro Software
        </div>
        {licenseData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, licenseData.length * 50)}>
            <BarChart data={licenseData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#f1f5f9", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} />
              <Bar dataKey="Genutzt" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Frei" stackId="a" fill="#334155" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ fontSize: 13, color: "#475569", fontFamily: "'DM Sans', sans-serif", padding: 40, textAlign: "center" }}>Keine Software vorhanden</div>
        )}
      </Card>
    </div>
  );
}

export default Dashboard;
