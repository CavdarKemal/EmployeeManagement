import { T } from "./tokens.js";

const Avatar = ({ name, size = 40 }) => {
  const initials = name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(99,102,241,0.2)",
        border: "1px solid rgba(99,102,241,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 600,
        color: "#a5b4fc",
        fontFamily: T.fontHeading,
        flexShrink: 0,
        letterSpacing: "0.5px",
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
