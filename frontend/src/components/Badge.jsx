const Badge = ({ label, color = "#94a3b8", bg = "rgba(148,163,184,0.12)", sm, children }) => (
  <span
    style={{
      background: bg,
      color,
      borderRadius: 20,
      padding: sm ? "2px 8px" : "3px 10px",
      fontSize: sm ? 10 : 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
      letterSpacing: "0.2px",
      display: "inline-block",
    }}
  >
    {label ?? children}
  </span>
);

export default Badge;
