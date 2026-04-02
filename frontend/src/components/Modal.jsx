const Modal = ({ title, children, onClose, width = 500 }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <style>{`
      @keyframes modalIn {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1); }
      }
    `}</style>
    <div
      style={{
        background: "#1e293b",
        borderRadius: "12px",
        border: "1px solid #334155",
        width: "100%",
        maxWidth: width,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        overflow: "hidden",
        animation: "modalIn 150ms ease both",
      }}
    >
      <div
        style={{
          padding: "18px 22px",
          borderBottom: "1px solid #334155",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: "#f1f5f9",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {title}
        </h3>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 20,
            color: "#94a3b8",
            lineHeight: 1,
            padding: "2px 6px",
            borderRadius: "6px",
            transition: "background 150ms ease, color 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#f1f5f9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  </div>
);

export default Modal;
