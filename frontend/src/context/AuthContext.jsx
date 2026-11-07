import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearSession, getToken, getUser, saveSession } from "../services/api.js";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());

  const finish = (data) => {
    const u = { ...data.user, workspace: data.workspace };
    saveSession(data.token, u);
    setToken(data.token);
    setUser(u);
  };
  const login = async (email, password) => finish(await api.login({ email, password }));
  const register = async (displayName, email, password) => finish(await api.register({ displayName, email, password }));
  const logout = useCallback(() => { clearSession(); setToken(null); setUser(null); }, []);

  useEffect(() => {
    window.addEventListener("dpf-logout", logout);
    return () => window.removeEventListener("dpf-logout", logout);
  }, [logout]);

  return <Ctx.Provider value={{ user, token, isAuthed: !!token, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
