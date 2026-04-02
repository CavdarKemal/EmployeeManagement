import { T } from "./tokens.js";

const Input = ({ label, value, onChange, type = "text", placeholder, required, error, hint }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
        {label}{required && " *"}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      style={{
        padding: "9px 12px",
        borderRadius: 8,
        border: `1.5px solid ${error ? T.danger : T.border}`,
        fontSize: 13,
        color: T.text,
        outline: "none",
        background: T.surface,
        boxSizing: "border-box",
        width: "100%",
      }}
    />
    {hint  && <span style={{ fontSize: 11, color: T.textMuted }}>{hint}</span>}
    {error && <span style={{ fontSize: 11, color: T.danger }}>{error}</span>}
  </div>
);

export default Input;
