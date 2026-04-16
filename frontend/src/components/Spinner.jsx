function Spinner({ text = "Laden …" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 40,
        color: "#64748b",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid #334155",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      {text}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Spinner;
