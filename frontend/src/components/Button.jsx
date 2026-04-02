import { useState } from "react";

const STYLES = {
  primary: {
    base:  { background: "#6366f1", color: "#fff", border: "none" },
    hover: { background: "#4f46e5" },
  },
  secondary: {
    base:  { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
    hover: { background: "#334155" },
  },
  danger: {
    base:  { background: "transparent", color: "#ef4444", border: "1px solid #ef4444" },
    hover: { background: "rgba(239,68,68,0.1)" },
  },
  ghost: {
    base:  { background: "transparent", color: "#94a3b8", border: "none" },
    hover: { background: "rgba(255,255,255,0.06)" },
  },
};

const Btn = ({ children, onClick, variant = "primary", sm, disabled, type = "button" }) => {
  const [hovered, setHovered] = useState(false);
  const s = STYLES[variant] || STYLES.primary;
  const combined = hovered && !disabled ? { ...s.base, ...s.hover } : s.base;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...combined,
        padding: sm ? "6px 12px" : "8px 16px",
        borderRadius: "8px",
        fontSize: sm ? 12 : 13,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        opacity: disabled ? 0.5 : 1,
        transition: "all 150ms ease",
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      {children}
    </button>
  );
};

export default Btn;
