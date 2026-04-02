import { T, DEPT } from "../components/tokens.js";
import Card from "../components/Card.jsx";

// Mock data — ersetzt durch API-Calls sobald Backend verfügbar
const EMPLOYEES = [
  { id: 1, employeeNumber: "EMP-001", firstName: "Maximilian", lastName: "Bauer",   email: "m.bauer@firma.de",   phone: "+49 30 1234567", position: "Senior Developer",  department: "Engineering",     hireDate: "2021-03-15", salary: 85000, active: true },
  { id: 2, employeeNumber: "EMP-002", firstName: "Sophie",     lastName: "Müller",  email: "s.mueller@firma.de", phone: "+49 89 9876543", position: "Product Manager",    department: "Product",         hireDate: "2020-07-01", salary: 90000, active: true },
  { id: 3, employeeNumber: "EMP-003", firstName: "Jonas",      lastName: "Weber",   email: "j.weber@firma.de",   phone: "+49 40 5555888", position: "UX Designer",        department: "Design",          hireDate: "2022-01-10", salary: 72000, active: true },
];
const HARDWARE = [
  { id: 1, assetTag: "HW-0001", name: 'MacBook Pro 16"',      category: "LAPTOP",     manufacturer: "Apple",  model: "MK183D/A",   serialNumber: "C02XY12345", status: "AVAILABLE",    purchasePrice: 2899, warrantyUntil: "2025-06-01" },
  { id: 2, assetTag: "HW-0002", name: 'Dell UltraSharp 27"',  category: "MONITOR",    manufacturer: "Dell",   model: "U2722D",     serialNumber: "D3L7890",    status: "LOANED",       purchasePrice: 549,  warrantyUntil: "2025-06-15", loanedTo: 1 },
  { id: 3, assetTag: "HW-0003", name: "ThinkPad X1 Carbon",   category: "LAPTOP",     manufacturer: "Lenovo", model: "Gen 10",     serialNumber: "LNV4567",    status: "AVAILABLE",    purchasePrice: 1899, warrantyUntil: "2024-11-10" },
  { id: 4, assetTag: "HW-0004", name: 'iPad Pro 12.9"',       category: "TABLET",     manufacturer: "Apple",  model: "MNXR3FD/A", serialNumber: "DMPH1234",   status: "AVAILABLE",    purchasePrice: 1299, warrantyUntil: "2026-02-20" },
];
const SOFTWARE = [
  { id: 1, name: "Microsoft 365",             vendor: "Microsoft", version: "2024",   category: "PRODUCTIVITY", licenseType: "SUBSCRIPTION", totalLicenses: 50, usedLicenses: 32, costPerLicense: 12.50, renewalDate: "2025-01-01" },
  { id: 2, name: "JetBrains IntelliJ IDEA",   vendor: "JetBrains", version: "2024.1", category: "DEV_TOOLS",    licenseType: "SUBSCRIPTION", totalLicenses: 15, usedLicenses: 8,  costPerLicense: 24.90, renewalDate: "2025-06-30" },
  { id: 3, name: "Figma Business",             vendor: "Figma",     version: "Web",    category: "DESIGN",       licenseType: "SUBSCRIPTION", totalLicenses: 10, usedLicenses: 7,  costPerLicense: 45.00, renewalDate: "2025-09-01" },
];

const KPI_COLORS = {
  employees: { accent: "#6366f1", bg: "rgba(99,102,241,0.12)",  icon: "👥" },
  available: { accent: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: "✅" },
  loaned:    { accent: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "📤" },
  licenses:  { accent: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  icon: "🔑" },
};

function Dashboard() {
  const active    = EMPLOYEES.filter((e) => e.active).length;
  const available = HARDWARE.filter((h) => h.status === "AVAILABLE").length;
  const loaned    = HARDWARE.filter((h) => h.status === "LOANED").length;
  const totalLic  = SOFTWARE.reduce((a, s) => a + s.totalLicenses, 0);
  const usedLic   = SOFTWARE.reduce((a, s) => a + s.usedLicenses, 0);

  const stats = [
    { key: "employees", label: "Aktive Mitarbeiter",  value: active,                    ...KPI_COLORS.employees },
    { key: "available", label: "Hardware verfügbar",  value: available,                 ...KPI_COLORS.available },
    { key: "loaned",    label: "Hardware ausgeliehen", value: loaned,                   ...KPI_COLORS.loaned    },
    { key: "licenses",  label: "Lizenzen in Nutzung", value: `${usedLic}/${totalLic}`,  ...KPI_COLORS.licenses  },
  ];

  const deptCounts = EMPLOYEES.reduce(
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
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f1f5f9",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Mitarbeiter nach Abteilung
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              Verteilung nach Organisationseinheit
            </div>
          </div>
          {Object.entries(deptCounts).map(([dept, count]) => {
            const pct = Math.round((count / EMPLOYEES.length) * 100);
            return (
              <div key={dept} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 6,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ color: "#f1f5f9" }}>{dept}</span>
                  <span style={{ color: "#94a3b8", fontWeight: 500 }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: "#334155", borderRadius: "4px" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: DEPT[dept] || "#6366f1",
                      borderRadius: "4px",
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </Card>

        {/* License bars */}
        <Card>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f1f5f9",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Lizenzauslastung
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              Aktive Lizenzen im Überblick
            </div>
          </div>
          {SOFTWARE.map((sw) => {
            const pct = Math.round((sw.usedLicenses / sw.totalLicenses) * 100);
            const high = pct >= 85;
            const barColor = high ? "#f59e0b" : "#6366f1";
            return (
              <div key={sw.id} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 6,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ color: "#f1f5f9", fontWeight: 500 }}>{sw.name}</span>
                  <span
                    style={{
                      color: high ? "#f59e0b" : "#94a3b8",
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                    }}
                  >
                    {sw.usedLicenses}/{sw.totalLicenses}
                  </span>
                </div>
                <div style={{ height: 8, background: "#334155", borderRadius: "4px" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: barColor,
                      borderRadius: "4px",
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
