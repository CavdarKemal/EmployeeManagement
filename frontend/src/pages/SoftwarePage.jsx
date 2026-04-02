import { useState } from "react";
import { T } from "../components/tokens.js";
import Btn from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Select from "../components/Select.jsx";

// Mock data
const INITIAL_EMPLOYEES = [
  { id: 1, firstName: "Maximilian", lastName: "Bauer",  active: true },
  { id: 2, firstName: "Sophie",     lastName: "Müller", active: true },
  { id: 3, firstName: "Jonas",      lastName: "Weber",  active: true },
];
const INITIAL_SOFTWARE = [
  { id: 1, name: "Microsoft 365",           vendor: "Microsoft", version: "2024",   category: "PRODUCTIVITY", licenseType: "SUBSCRIPTION", totalLicenses: 50, usedLicenses: 32, costPerLicense: 12.50, renewalDate: "2025-01-01" },
  { id: 2, name: "JetBrains IntelliJ IDEA", vendor: "JetBrains", version: "2024.1", category: "DEV_TOOLS",    licenseType: "SUBSCRIPTION", totalLicenses: 15, usedLicenses: 8,  costPerLicense: 24.90, renewalDate: "2025-06-30" },
  { id: 3, name: "Figma Business",           vendor: "Figma",     version: "Web",    category: "DESIGN",       licenseType: "SUBSCRIPTION", totalLicenses: 10, usedLicenses: 7,  costPerLicense: 45.00, renewalDate: "2025-09-01" },
];

const CAT_EMOJI = { PRODUCTIVITY: "📊", DEV_TOOLS: "🛠️", DESIGN: "🎨", OS: "💾" };

const CAT_COLORS = {
  PRODUCTIVITY: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  DEV_TOOLS:    { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  DESIGN:       { color: "#ec4899", bg: "rgba(236,72,153,0.12)"  },
  OS:           { color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

function SoftwarePage({ toast }) {
  const [software, setSoftware]   = useState(INITIAL_SOFTWARE);
  const [assignDialog, setAssignDialog] = useState(null);
  const [employees]               = useState(INITIAL_EMPLOYEES);
  const [empId, setEmpId]         = useState("");

  const handleAssign = (swId) => {
    if (!empId) return;
    setSoftware((s) => s.map((sw) => sw.id === swId ? { ...sw, usedLicenses: sw.usedLicenses + 1 } : sw));
    toast("Lizenz zugewiesen ✅");
    setAssignDialog(null);
    setEmpId("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn>＋ Software</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {software.map((sw) => {
          const pct      = Math.round((sw.usedLicenses / sw.totalLicenses) * 100);
          const low      = pct >= 85;
          const daysLeft = Math.ceil((new Date(sw.renewalDate) - new Date()) / (1000 * 86400));
          const catEmoji = CAT_EMOJI[sw.category] || "💾";
          const catStyle = CAT_COLORS[sw.category] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
          const barColor = low ? "#f59e0b" : "#6366f1";

          return (
            <Card key={sw.id} p={20}>
              {/* Header */}
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "10px",
                    background: catStyle.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {catEmoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 16,
                          color: "#f1f5f9",
                          fontFamily: "'Sora', sans-serif",
                        }}
                      >
                        {sw.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          marginTop: 2,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {sw.vendor} · v{sw.version}
                      </div>
                    </div>
                    <Badge label={sw.vendor} color={catStyle.color} bg={catStyle.bg} sm />
                  </div>
                </div>
              </div>

              {/* License bar */}
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    marginBottom: 8,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>Lizenzen</span>
                  <span
                    style={{
                      color: low ? "#f59e0b" : "#94a3b8",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      fontSize: 12,
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
                      borderRadius: "4px",
                      background: barColor,
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  fontSize: 12,
                  color: "#475569",
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: low ? 12 : 0,
                }}
              >
                <span>{sw.costPerLicense?.toFixed(2)} €/Lizenz/Monat</span>
                <span>{(sw.totalLicenses * sw.costPerLicense * 12).toFixed(0)} €/Jahr</span>
                <span style={{ color: daysLeft < 60 ? "#ef4444" : "#475569" }}>
                  Erneuerung: {new Date(sw.renewalDate).toLocaleDateString("de-DE")}
                  {daysLeft > 0 ? ` (in ${daysLeft} Tagen)` : " ⚠️ abgelaufen"}
                </span>
              </div>

              {/* Warning banner */}
              {low && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "rgba(245,158,11,0.10)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: "6px",
                    fontSize: 12,
                    color: "#f59e0b",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  ⚠️ Lizenzkapazität fast erschöpft ({pct}%)
                </div>
              )}

              {/* Action */}
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <Btn
                  sm
                  variant="secondary"
                  onClick={() => setAssignDialog(sw)}
                  disabled={sw.usedLicenses >= sw.totalLicenses}
                >
                  Zuweisen
                </Btn>
              </div>
            </Card>
          );
        })}
      </div>

      {assignDialog && (
        <Modal
          title={`Lizenz zuweisen: ${assignDialog.name}`}
          onClose={() => { setAssignDialog(null); setEmpId(""); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                padding: "10px 14px",
                background: "#0f172a",
                borderRadius: "8px",
                border: "1px solid #334155",
                fontSize: 13,
                color: "#94a3b8",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Noch{" "}
              <strong style={{ color: "#f1f5f9" }}>
                {assignDialog.totalLicenses - assignDialog.usedLicenses}
              </strong>{" "}
              Lizenzen verfügbar.
            </div>
            <Select
              label="Mitarbeiter auswählen *"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              options={employees.filter((e) => e.active).map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
            />
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="ghost" onClick={() => { setAssignDialog(null); setEmpId(""); }}>Abbrechen</Btn>
            <Btn onClick={() => handleAssign(assignDialog.id)} disabled={!empId}>Zuweisen</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SoftwarePage;
