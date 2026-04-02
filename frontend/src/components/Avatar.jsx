import { T } from "./tokens.js";

const Avatar = ({ name, size = 40 }) => {
  const initials = name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: T.primaryLight + "33",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: T.primary,
        flexShrink: 0,
        border: `2px solid ${T.primaryLight}55`,
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
