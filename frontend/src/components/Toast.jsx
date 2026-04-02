import { T } from "./tokens.js";

const Toast = ({ msg, type = "success" }) => (
  <div
    style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 2000,
      background: type === "error" ? T.danger : T.success,
      color: "#fff",
      padding: "12px 20px",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 600,
      boxShadow: "0 4px 16px rgba(0,0,0,.2)",
      maxWidth: 360,
    }}
  >
    {msg}
  </div>
);

export default Toast;
