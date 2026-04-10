import { useState, useEffect } from "react";
import api from "../api/index.js";
import Card from "../components/Card.jsx";
import Btn from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import Spinner from "../components/Spinner.jsx";
import Badge from "../components/Badge.jsx";

function NotificationConfigPage({ toast }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get("/admin/notifications/config")
      .then(setConfig)
      .catch(() => toast?.("Konfiguration konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const handleTestMail = async () => {
    if (!testEmail) return;
    setSending(true);
    try {
      const token = localStorage.getItem("jwt");
      const res = await fetch(`/api/v1/admin/notifications/test?to=${encodeURIComponent(testEmail)}`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      toast(data.status === "OK" ? data.message : `Fehler: ${data.message}`);
    } catch {
      toast("Test-Mail fehlgeschlagen");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner text="Konfiguration laden …" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 700 }}>

      {/* Status */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}>
              E-Mail-Benachrichtigungen
            </div>
            <div style={{ fontSize: 12, color: "#475569", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
              Tägliche Prüfung um 08:00 Uhr
            </div>
          </div>
          <Badge
            label={config?.enabled ? "Aktiv" : "Deaktiviert"}
            color={config?.enabled ? "#10b981" : "#64748b"}
            bg={config?.enabled ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)"}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "SMTP-Server", value: config?.mailHost || "—" },
            { label: "SMTP-Benutzer", value: config?.mailUsername || "—" },
            { label: "Empfänger", value: config?.recipient || "—" },
            { label: "Garantie-Warnung", value: `${config?.warrantyDays || 30} Tage vorher` },
            { label: "Lizenz-Warnung", value: `${config?.renewalDays || 30} Tage vorher` },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 14, color: "#f1f5f9", fontFamily: "'JetBrains Mono', monospace" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

      </Card>

      {/* Test Mail */}
      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif", marginBottom: 12 }}>
          Test-E-Mail senden
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Empfänger-Adresse"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="name@firma.de"
            />
          </div>
          <Btn onClick={handleTestMail} disabled={!testEmail || sending}>
            {sending ? "Senden …" : "Test senden"}
          </Btn>
        </div>
      </Card>

      {/* Info */}
      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif", marginBottom: 12 }}>
          Welche Benachrichtigungen werden gesendet?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "🔧", title: "Garantie-Ablauf", desc: "Hardware-Geräte deren Garantie in den nächsten N Tagen abläuft." },
            { icon: "🔑", title: "Lizenz-Erneuerung", desc: "Software-Lizenzen die in den nächsten N Tagen erneuert werden müssen." },
          ].map((n) => (
            <div key={n.title} style={{ display: "flex", gap: 12, padding: "10px 14px", background: "#0f172a", borderRadius: "8px", border: "1px solid #334155" }}>
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>{n.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{n.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default NotificationConfigPage;
