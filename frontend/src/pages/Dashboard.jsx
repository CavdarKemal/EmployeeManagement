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

function Dashboard() {
  const active    = EMPLOYEES.filter((e) => e.active).length;
  const available = HARDWARE.filter((h) => h.status === "AVAILABLE").length;
  const loaned    = HARDWARE.filter((h) => h.status === "LOANED").length;
  const totalLic  = SOFTWARE.reduce((a, s) => a + s.totalLicenses, 0);
  const usedLic   = SOFTWARE.reduce((a, s) => a + s.usedLicenses, 0);

  const stats = [
    { icon: "👥", label: "Aktive Mitarbeiter",    value: active,              color: T.primary },
    { icon: "✅", label: "Hardware verfügbar",     value: available,           color: T.success },
    { icon: "📤", label: "Hardware ausgeliehen",   value: loaned,              color: T.warning },
    { icon: "🔑", label: "Lizenzen in Nutzung",   value: `${usedLic}/${totalLic}`, color: "#8b5cf6" },
  ];

  const deptCounts = EMPLOYEES.reduce(
    (a, e) => ({ ...a, [e.department]: (a[e.department] || 0) + 1 }),
    {}
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 12,
                background: s.color + "1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>👥 Mitarbeiter nach Abteilung</div>
          {Object.entries(deptCounts).map(([dept, count]) => (
            <div key={dept} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: T.text }}>{dept}</span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
              <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(count / EMPLOYEES.length) * 100}%`,
                    background: DEPT[dept] || T.primary,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🔑 Lizenzauslastung</div>
          {SOFTWARE.map((sw) => {
            const pct = Math.round((sw.usedLicenses / sw.totalLicenses) * 100);
            return (
              <div key={sw.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: T.text, fontWeight: 500 }}>{sw.name}</span>
                  <span style={{ color: pct >= 85 ? T.danger : T.textMuted, fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 5, background: T.border, borderRadius: 3 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: pct >= 85 ? T.danger : T.primary,
                      borderRadius: 3,
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
