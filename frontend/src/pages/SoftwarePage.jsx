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

      {software.map((sw) => {
        const pct      = Math.round((sw.usedLicenses / sw.totalLicenses) * 100);
        const low      = pct >= 85;
        const daysLeft = Math.ceil((new Date(sw.renewalDate) - new Date()) / (1000 * 86400));
        const catEmoji = CAT_EMOJI[sw.category] || "💾";

        return (
          <Card key={sw.id}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12, background: T.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, flexShrink: 0,
                }}
              >
                {catEmoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{sw.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{sw.vendor} · v{sw.version}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge label={sw.licenseType} color={T.text} bg={T.bg} sm />
                    <Badge label={sw.category}    color={T.text} bg={T.bg} sm />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: T.textMuted }}>
                      Lizenzen: <strong style={{ color: T.text }}>{sw.usedLicenses} / {sw.totalLicenses}</strong>
                    </span>
                    <span style={{ color: low ? T.danger : T.textMuted, fontWeight: 600 }}>{pct}%{low && " ⚠️"}</span>
                  </div>
                  <div style={{ height: 7, background: T.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: low ? T.danger : T.primary, transition: "width .3s" }} />
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: T.textMuted }}>
                  <span>💶 {sw.costPerLicense?.toFixed(2)} €/Lizenz/Monat</span>
                  <span>💶 {(sw.totalLicenses * sw.costPerLicense * 12).toFixed(0)} €/Jahr gesamt</span>
                  <span style={{ color: daysLeft < 60 ? T.danger : T.textMuted }}>
                    📅 Erneuerung: {new Date(sw.renewalDate).toLocaleDateString("de-DE")} ({daysLeft > 0 ? `in ${daysLeft} Tagen` : "⚠️ abgelaufen"})
                  </span>
                </div>
              </div>
              <Btn sm variant="secondary" onClick={() => setAssignDialog(sw)} disabled={sw.usedLicenses >= sw.totalLicenses}>
                Zuweisen
              </Btn>
            </div>
          </Card>
        );
      })}

      {assignDialog && (
        <Modal
          title={`Lizenz zuweisen: ${assignDialog.name}`}
          onClose={() => { setAssignDialog(null); setEmpId(""); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: "10px 14px", background: T.bg, borderRadius: 9, fontSize: 13, color: T.textMuted }}>
              Noch {assignDialog.totalLicenses - assignDialog.usedLicenses} Lizenzen verfügbar.
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
