import { T } from "./tokens.js";

const STYLES = {
  primary:   { background: T.primary, color: "#fff", border: "none" },
  secondary: { background: "transparent", color: T.primary, border: `1.5px solid ${T.primary}` },
  danger:    { background: T.danger,  color: "#fff", border: "none" },
  ghost:     { background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` },
};

const Btn = ({ children, onClick, variant = "primary", sm, disabled, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      ...STYLES[variant],
      padding: sm ? "6px 12px" : "9px 18px",
      borderRadius: 8,
      fontSize: sm ? 12 : 13,
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      opacity: disabled ? 0.6 : 1,
      transition: "all .15s",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </button>
);

export default Btn;
