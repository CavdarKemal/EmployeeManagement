const Badge = ({ label, color = "#374151", bg = "#f3f4f6", sm }) => (
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
    }}
  >
    {label}
  </span>
);

export default Badge;
