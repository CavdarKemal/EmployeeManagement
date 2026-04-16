import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const THEMES = {
  dark: {
    bg: "#0f172a",
    bgCard: "#1e293b",
    bgInput: "#0f172a",
    border: "#334155",
    borderLight: "#1e293b",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    textDim: "#64748b",
    textFaint: "#475569",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.12)",
    accentText: "#a5b4fc",
    success: "#10b981",
    successBg: "rgba(16,185,129,0.12)",
    warning: "#f59e0b",
    warningBg: "rgba(245,158,11,0.12)",
    danger: "#ef4444",
    dangerBg: "rgba(239,68,68,0.12)",
    shadow: "rgba(0,0,0,0.5)",
    hover: "rgba(255,255,255,0.04)",
  },
  light: {
    bg: "#f8fafc",
    bgCard: "#ffffff",
    bgInput: "#ffffff",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    text: "#0f172a",
    textMuted: "#475569",
    textDim: "#64748b",
    textFaint: "#94a3b8",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.08)",
    accentText: "#4f46e5",
    success: "#059669",
    successBg: "rgba(5,150,105,0.08)",
    warning: "#d97706",
    warningBg: "rgba(217,119,6,0.08)",
    danger: "#dc2626",
    dangerBg: "rgba(220,38,38,0.08)",
    shadow: "rgba(0,0,0,0.1)",
    hover: "rgba(0,0,0,0.03)",
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    localStorage.setItem("theme", mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  const t = THEMES[mode];

  return (
    <ThemeContext.Provider value={{ mode, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
