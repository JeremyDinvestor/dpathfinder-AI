import { useState } from "react";
import { Link } from "react-router-dom";
import Chat from "../../components/Chat.jsx";
import { Logo, ThemeButton } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTitle } from "../../hooks.js";
import { api } from "../../services/api.js";

const KEY = "dpf_demo_conversation";

// Its own layout (no site navigation): a focused workspace for the public demo.
export default function PlaygroundPage() {
  useTitle("Playground");
  const { isAuthed } = useAuth();
  const [session, setSession] = useState(0); // changing this restarts the chat
  const [note, setNote] = useState("");
  const [resetting, setResetting] = useState(false);

  async function reset() {
    setResetting(true);
    setNote("");
    try {
      const r = await api.demoReset();
      try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
      setSession((s) => s + 1);
      setNote(r?.message || "Demo data restored.");
    } catch (e) { setNote(e.message); }
    finally { setResetting(false); }
  }

  return (
    <div className="pgl">
      <div className="pgh">
        <Link to="/" className="mu">← Back to site</Link>
        <Logo s={24} />
        <span className="sp" />
        {note && <span className="mu sm" role="status">{note}</span>}
        <span className="tag" style={{ margin: 0 }}>Demo workspace, shared</span>
        <ThemeButton />
        <button type="button" className="b" onClick={reset} disabled={resetting}>{resetting ? "Resetting…" : "Reset demo"}</button>
        {isAuthed ? <Link className="b bp" to="/dashboard">Dashboard</Link> : <Link className="b bp" to="/login">Sign In</Link>}
      </div>
      <Chat key={session} send={api.demoChat} storageKey={KEY} intro="Hi, I’m the DPathfinder agent. Ask me about customers, orders or reports in this demo workspace." />
    </div>
  );
}
