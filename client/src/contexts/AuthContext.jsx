import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API } from "../utils/format.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("al_token");
    const storedUser = localStorage.getItem("al_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/api/auth/login`, { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("al_token", data.token);
    localStorage.setItem("al_user", JSON.stringify(data.user));
    return data;
  };

  const signup = async (name, email, password) => {
    const { data } = await axios.post(`${API}/api/auth/signup`, { name, email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("al_token", data.token);
    localStorage.setItem("al_user", JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("al_token");
    localStorage.removeItem("al_user");
  };

  // Demo mode: if no real user, use a mock user for seamless demo
  const effectiveUser = user || { name: "Arjun Kumar", email: "arjun@example.com" };

  return (
    <AuthContext.Provider value={{ user: effectiveUser, realUser: user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
