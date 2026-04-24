import { useState } from "react";

const Input = ({ label, value, onChange, type = "text", placeholder, required, error, hint, readOnly }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && (
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#94a3b8",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {label}{required && " *"}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: "10px 14px",
          borderRadius: "8px",
          border: `1px solid ${error ? "#ef4444" : focused ? "#6366f1" : "#334155"}`,
          fontSize: 13,
          color: readOnly ? "#94a3b8" : "#f1f5f9",
          outline: "none",
          background: readOnly ? "#1e293b" : "#0f172a",
          boxSizing: "border-box",
          width: "100%",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: focused && !readOnly ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
          cursor: readOnly ? "not-allowed" : "text",
        }}
      />
      {hint  && <span style={{ fontSize: 11, color: "#94a3b8" }}>{hint}</span>}
      {error && <span style={{ fontSize: 11, color: "#ef4444" }}>{error}</span>}
    </div>
  );
};

export default Input;
