import { useState } from "react";

/**
 * Passwort-Eingabefeld mit Anzeigen-Toggle und optionalem
 * Bestätigungsfeld. Vollständig controlled: der Parent hält
 * beide Werte und prüft selbst, ob sie übereinstimmen.
 *
 * Props:
 *   value           — Passwort (pflicht)
 *   onChange(val)   — Setter für Passwort (pflicht)
 *   confirmValue    — Bestätigungs-Passwort (nur mit verify)
 *   onConfirmChange — Setter für Bestätigung (nur mit verify)
 *   verify          — zweites Feld aktivieren
 *   placeholder, autoFocus
 *   inputStyle      — Style für beide <input>-Felder
 *   error           — Fehlertext vom Parent
 */
export default function PasswordInput({
  value,
  onChange,
  confirmValue = "",
  onConfirmChange,
  verify = false,
  placeholder = "",
  autoFocus = false,
  inputStyle = {},
  error,
}) {
  const [show, setShow] = useState(false);

  const mismatch = verify && confirmValue.length > 0 && confirmValue !== value;

  const toggleStyle = {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: "4px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
  };
  const inputWithPadding = { ...inputStyle, paddingRight: 78 };

  const Toggle = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      style={toggleStyle}
      tabIndex={-1}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#a5b4fc")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
    >
      {show ? "Verbergen" : "Anzeigen"}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="new-password"
          style={inputWithPadding}
        />
        {Toggle}
      </div>

      {verify && (
        <div style={{ position: "relative" }}>
          <input
            type={show ? "text" : "password"}
            value={confirmValue}
            onChange={(e) => onConfirmChange?.(e.target.value)}
            placeholder="Passwort wiederholen"
            autoComplete="new-password"
            style={{
              ...inputWithPadding,
              ...(mismatch ? { border: "1px solid #ef4444" } : {}),
            }}
          />
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>{error}</div>
      )}
      {mismatch && !error && (
        <div style={{ fontSize: 11, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>
          Passwörter stimmen nicht überein
        </div>
      )}
    </div>
  );
}
