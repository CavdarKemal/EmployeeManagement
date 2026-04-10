import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Input from "../components/Input.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
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
      setErr("Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        backgroundImage: "radial-gradient(ellipse at 80% 10%, rgba(99,102,241,0.15) 0%, transparent 60%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "40px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "12px",
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Sora', sans-serif",
              color: "#fff",
            }}
          >
            EM
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: "#f1f5f9",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            EmployeeManagement
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Anmelden um fortzufahren
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
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
              Passwort
            </label>
            <PasswordInput
              value={pass}
              onChange={setPass}
              placeholder="••••••••"
              inputStyle={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #334155",
                fontSize: 13,
                color: "#f1f5f9",
                outline: "none",
                background: "#0f172a",
                boxSizing: "border-box",
                width: "100%",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
          {err && (
            <div style={{ color: "#ef4444", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
              {err}
            </div>
          )}
          <div style={{ marginTop: 4 }}>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 16px",
                borderRadius: "8px",
                border: "none",
                background: loading ? "#4f46e5" : "#6366f1",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 150ms ease",
                opacity: loading ? 0.8 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#4f46e5"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#6366f1"; }}
            >
              {loading ? "Anmelden …" : "Anmelden"}
            </button>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 11,
            color: "#475569",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Demo: admin@firma.de / admin123
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
