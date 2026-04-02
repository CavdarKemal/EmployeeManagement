const Toast = ({ msg, type = "success" }) => {
  const borderColor = type === "error" ? "#ef4444" : "#10b981";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 2000,
        background: "#1e293b",
        borderLeft: `4px solid ${borderColor}`,
        border: `1px solid #334155`,
        borderLeftColor: borderColor,
        color: "#f1f5f9",
        padding: "12px 20px",
        borderRadius: "8px",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        maxWidth: 360,
      }}
    >
      {msg}
    </div>
  );
};

export default Toast;
