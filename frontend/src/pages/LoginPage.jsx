import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { T } from "../components/tokens.js";
import Input from "../components/Input.jsx";
import Btn from "../components/Button.jsx";

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@firma.de");
  const [pass, setPass]   = useState("admin123");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErr(""); setLoading(true);
    try {
      await login(email, pass);
    } catch {
      // Demo: ignoriere Fehler und logge direkt ein (Mock-Modus)
      localStorage.setItem("jwt", "DEMO_TOKEN");
      localStorage.setItem("userEmail", email);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${T.primaryDark} 0%, ${T.primary} 60%, ${T.primaryLight} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,.97)",
          borderRadius: 20,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 24px 80px rgba(0,0,0,.25)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: T.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: 26,
            }}
          >
            🏢
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.primaryDark }}>
            EmployeeManagement
          </h1>
          <p style={{ margin: "4px 0 0", color: T.textMuted, fontSize: 13 }}>
            Corporate Asset &amp; Employee Management
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@firma.de"
          />
          <Input
            label="Passwort"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
          />
          {err && <div style={{ color: T.danger, fontSize: 12 }}>{err}</div>}
          <Btn onClick={handleLogin} disabled={loading}>
            {loading ? "Anmelden …" : "Anmelden"}
          </Btn>
        </div>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: T.textMuted }}>
          Demo: admin@firma.de / admin123
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
