import { createContext, useContext, useEffect, useState } from "react";
import api, { AuthCtx } from "../api/index.js";

const AuthContext = createContext(null);

function readStoredUser() {
  const token = localStorage.getItem("jwt");
  if (!token) return null;
  return {
    token,
    email: localStorage.getItem("userEmail") || "",
    displayName: localStorage.getItem("userName") || "",
    role: localStorage.getItem("userRole") || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // Nach Page-Reload die Rolle auffrischen, falls wir noch keine haben
  // (oder falls sie sich serverseitig geändert hat).
  useEffect(() => {
    if (user?.token && !user.role) {
      api.get("/auth/me")
        .then((me) => {
          if (!me) return;
          localStorage.setItem("userEmail", me.email);
          localStorage.setItem("userName", me.displayName || "");
          localStorage.setItem("userRole", me.role);
          setUser((u) => ({ ...u, ...me }));
        })
        .catch(() => {});
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("jwt", data.token);
    localStorage.setItem("userEmail", data.email || email);
    localStorage.setItem("userName", data.displayName || "");
    localStorage.setItem("userRole", data.role || "");
    setUser({
      token: data.token,
      email: data.email || email,
      displayName: data.displayName || "",
      role: data.role || null,
    });
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    setUser(null);
  };

  // Expose logout to the api layer for 401 handling
  AuthCtx.logout = logout;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
