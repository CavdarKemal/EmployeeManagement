const Card = ({ children, p = 20, style = {} }) => (
  <div
    style={{
      background: "#1e293b",
      borderRadius: "12px",
      border: "1px solid #334155",
      padding: p,
      ...style,
    }}
  >
    {children}
  </div>
);

export default Card;
