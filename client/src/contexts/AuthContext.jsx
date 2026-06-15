import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const USERS_KEY = "al_users";
const SESSION_KEY = "al_session";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  // Initialize synchronously so there's no first-render flash with wrong user
  const [user, setUser] = useState(() => loadSession());
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const users = loadUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) throw { response: { data: { message: "No account found with this email." } } };
    if (found.password !== password) throw { response: { data: { message: "Incorrect password." } } };
    const sessionUser = { id: found.id, name: found.name, email: found.email };
    setUser(sessionUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return { user: sessionUser };
  };

  const signup = async (name, email, password) => {
    const users = loadUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw { response: { data: { message: "An account with this email already exists." } } };
    }
    const newUser = { id: `u_${Date.now()}`, name, email: email.toLowerCase(), password };
    saveUsers([...users, newUser]);
    const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    setUser(sessionUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return { user: sessionUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateProfile = (patch) => {
    const updated = { ...user, ...patch };
    setUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, realUser: user, token: null, login, signup, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
