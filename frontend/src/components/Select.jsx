import { T } from "./tokens.js";

const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
        {label}{required && " *"}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      style={{
        padding: "9px 12px",
        borderRadius: 8,
        border: `1.5px solid ${T.border}`,
        fontSize: 13,
        color: T.text,
        background: T.surface,
        outline: "none",
        cursor: "pointer",
      }}
    >
      <option value="">– Auswählen –</option>
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  </div>
);

export default Select;
