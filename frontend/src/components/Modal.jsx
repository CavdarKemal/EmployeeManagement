const Modal = ({ title, children, onClose, width = 500 }) => {
  const isMobile = window.innerWidth < 768;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: ${isMobile ? "translateY(100%)" : "scale(0.95)"}; }
          to   { opacity: 1; transform: ${isMobile ? "translateY(0)" : "scale(1)"}; }
        }
      `}</style>
      <div
        style={{
          background: "#1e293b",
          borderRadius: isMobile ? "16px 16px 0 0" : "12px",
          border: "1px solid #334155",
          width: "100%",
          maxWidth: isMobile ? "100%" : width,
          maxHeight: isMobile ? "90vh" : "85vh",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          overflow: "hidden",
          animation: "modalIn 200ms ease both",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              border: "none", background: "transparent", cursor: "pointer",
              fontSize: 20, color: "#94a3b8", lineHeight: 1, padding: "2px 6px",
              borderRadius: "6px", transition: "background 150ms ease, color 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 22, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
