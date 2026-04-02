import { createContext, useContext, useState } from "react";
import api, { AuthCtx } from "../api/index.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("jwt");
    const email = localStorage.getItem("userEmail");
    return token ? { email, token } : null;
  });

  const login = async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("jwt", data.token);
    localStorage.setItem("userEmail", email);
    setUser({ email, token: data.token });
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("userEmail");
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
