import { useState } from "react";

const Select = ({ label, value, onChange, options, required }) => {
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
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            padding: "10px 36px 10px 14px",
            borderRadius: "8px",
            border: `1px solid ${focused ? "#6366f1" : "#334155"}`,
            fontSize: 13,
            color: "#f1f5f9",
            background: "#0f172a",
            outline: "none",
            cursor: "pointer",
            width: "100%",
            appearance: "none",
            WebkitAppearance: "none",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
            transition: "border-color 150ms ease, box-shadow 150ms ease",
          }}
        >
          <option value="" style={{ background: "#1e293b", color: "#f1f5f9" }}>– Auswählen –</option>
          {options.map((o) => (
            <option
              key={o.value ?? o}
              value={o.value ?? o}
              style={{ background: "#1e293b", color: "#f1f5f9" }}
            >
              {o.label ?? o}
            </option>
          ))}
        </select>
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
            pointerEvents: "none",
            fontSize: 14,
          }}
        >
          ▾
        </span>
      </div>
    </div>
  );
};

export default Select;
