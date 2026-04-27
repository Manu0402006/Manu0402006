import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cynos_admin_token");
    if (!token) { setChecking(false); return; }
    api.get("/auth/me")
      .then(({ data }) => setAdmin(data))
      .catch(() => { localStorage.removeItem("cynos_admin_token"); setAdmin(null); })
      .finally(() => setChecking(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("cynos_admin_token", data.access_token);
    setAdmin(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("cynos_admin_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
