import { createContext, useCallback, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);
const systemTheme = () => (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(() => { try { return localStorage.getItem("dpf-theme") || "system"; } catch { return "system"; } });
  const [system, setSystem] = useState(systemTheme());

  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setSystem(systemTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (pref === "system") delete root.dataset.theme; else root.dataset.theme = pref;
    try { localStorage.setItem("dpf-theme", pref); } catch { /* storage unavailable */ }
  }, [pref]);

  const theme = pref === "system" ? system : pref; // the theme actually showing: "light" or "dark"
  const toggle = useCallback(() => setPref(theme === "dark" ? "light" : "dark"), [theme]);
  return <Ctx.Provider value={{ theme, pref, setPref, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
