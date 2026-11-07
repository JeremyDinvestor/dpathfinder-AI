import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui.jsx";

const CHIPS = ["List customers", "Show pending orders", "Update an order status", "Generate a business report", "Create a customer"];

// Chat window + Agent Activity panel.
// `send({ message, conversationId })` must return { reply, conversationId, toolCalls }.
// The activity panel shows ONLY what the backend reports in `toolCalls`. Nothing is invented.
export default function Chat({ send, storageKey, inline = false, intro }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState(true);
  const conv = useRef((() => { try { return sessionStorage.getItem(storageKey) || ""; } catch { return ""; } })());
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);

  const remember = (id) => {
    conv.current = id || "";
    try { id ? sessionStorage.setItem(storageKey, id) : sessionStorage.removeItem(storageKey); } catch { /* storage unavailable */ }
  };

  async function submit(raw) {
    const message = raw.trim();
    if (!message || busy) return;
    setText("");
    setMsgs((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    const attempt = () => send({ message, ...(conv.current ? { conversationId: conv.current } : {}) });
    try {
      let r;
      try { r = await attempt(); }
      catch (e) {
        if (e.code !== "conversation_not_found") throw e;
        remember(""); // the stored conversation no longer exists (for example after a demo reset)
        r = await attempt();
      }
      remember(r.conversationId);
      setMsgs((m) => [...m, { role: "agent", text: r.reply, toolCalls: r.toolCalls || [] }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "agent", text: e.message, failed: true, toolCalls: [] }]);
    } finally { setBusy(false); }
  }

  const last = [...msgs].reverse().find((m) => m.role === "agent");

  return (
    <div className={`pgb${inline ? " in" : ""}`}>
      <div className="chat">
        <div className="cm">
          <div className="ma">{intro || "Hi, I’m the DPathfinder agent. Ask me about customers, orders or reports."}</div>
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div className="mu1" key={i}>{m.text}</div>
            ) : (
              <div className="ma" key={i} style={{ whiteSpace: "pre-wrap" }}>
                {m.text}
                {m.toolCalls.map((t, j) => (
                  <div key={j}><span className="tag" style={{ margin: "8px 0 0" }}><Icon n="box" s={14} c="var(--cy)" /> {t.name} {t.ok ? "✓" : "✕"}</span></div>
                ))}
              </div>
            )
          )}
          {busy && <div className="ma" role="status" aria-live="polite">Working on it…</div>}
          <div ref={endRef} />
        </div>
        <div className="chips">
          {CHIPS.map((c) => <button type="button" key={c} className="chip" disabled={busy} onClick={() => submit(c)}>{c}</button>)}
        </div>
        <form className="ci" onSubmit={(e) => { e.preventDefault(); submit(text); }}>
          <input value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Ask the agent…" aria-label="Message" />
          <button type="submit" className="b bp" disabled={busy || !text.trim()}>Send</button>
        </form>
      </div>

      <aside className="act" aria-label="Agent Activity">
        <div className="row sb2">
          <b>Agent Activity</b>
          <button type="button" className="linkbtn" onClick={() => setPanel(!panel)} aria-expanded={panel}>{panel ? "Hide" : "Show"}</button>
        </div>
        {panel && (
          last ? (
            <>
              <div className="ai">✓ Request received</div>
              {last.toolCalls.map((t, i) => (
                <details className="ai" key={i} open={!t.ok}>
                  <summary>{t.ok ? "✓" : "✕"} {t.name}</summary>
                  <p className="mu sm">{t.ok ? "Ran successfully in your workspace." : t.error || "The tool failed."}</p>
                </details>
              ))}
              {!last.toolCalls.length && !last.failed && <div className="ai">✓ No tool was needed</div>}
              <div className="ai">{last.failed ? "✕ Request failed" : "✓ Response generated"}</div>
            </>
          ) : (
            <p className="mu sm">Send a message to see which tools the backend ran.</p>
          )
        )}
        <p className="mu sm">Shows only what the backend reports. Nothing here is simulated.</p>
      </aside>
    </div>
  );
}
