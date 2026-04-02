import { T } from "./tokens.js";

const Modal = ({ title, children, onClose, width = 500 }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.45)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      style={{
        background: T.surface,
        borderRadius: T.radius + 4,
        width: "100%",
        maxWidth: width,
        boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 22px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{title}</h3>
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: T.textMuted, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  </div>
);

export default Modal;
