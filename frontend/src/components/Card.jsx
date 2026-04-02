import { T } from "./tokens.js";

const Card = ({ children, p = 20, style = {} }) => (
  <div
    style={{
      background: T.surface,
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      padding: p,
      boxShadow: T.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

export default Card;
