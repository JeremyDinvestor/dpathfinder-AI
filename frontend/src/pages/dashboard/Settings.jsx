import { useTheme } from "../../context/ThemeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTitle } from "../../hooks.js";

export default function Settings() {
  useTitle("Settings");
  const { pref, setPref } = useTheme();
  const { user, logout } = useAuth();
  const w = user?.workspace;
  return (
    <>
      <div className="c">
        <b>Appearance</b>
        <p className="mu">Choose how DPathfinder AI looks.</p>
        <div className="chips">
          {["light", "dark", "system"].map((t) => <button type="button" key={t} className={`chip${pref === t ? " on" : ""}`} onClick={() => setPref(t)}>{t}</button>)}
        </div>
      </div>
      <div className="c">
        <b>Account</b>
        <p className="mu">Name: {user?.displayName || "-"}</p>
        <p className="mu">Email: {user?.email || "-"}</p>
        <p className="mu">Workspace: {w?.name || "-"}{w?.tier ? ` (${w.tier})` : ""}</p>
        <button type="button" className="b" onClick={logout}>Log out</button>
      </div>
    </>
  );
}
