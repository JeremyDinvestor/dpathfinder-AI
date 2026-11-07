import { useState } from "react";
import { Icon, Pill, State } from "../../components/ui.jsx";
import { useAsync, useTitle } from "../../hooks.js";
import { api, shortDate } from "../../services/api.js";

const SCOPES = ["chat", "customers:read", "customers:write", "orders:read", "orders:write", "reports:read"];
const DEFAULT_SCOPES = ["chat", "customers:read", "orders:read", "reports:read"]; // read-only plus chat

export default function ApiKeys() {
  useTitle("API Keys");
  const list = useAsync(() => api.apiKeys(), []);
  const [label, setLabel] = useState("");
  const [days, setDays] = useState("");
  const [scopes, setScopes] = useState(DEFAULT_SCOPES);
  const [fresh, setFresh] = useState(null); // the key just created. It is shown ONCE and never stored here.
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = (s) => setScopes(scopes.includes(s) ? scopes.filter((x) => x !== s) : [...scopes, s]);

  async function create(e) {
    e.preventDefault();
    setError(""); setFresh(null);
    if (!label.trim()) return setError("Give the key a label.");
    if (!scopes.length) return setError("Choose at least one scope.");
    setBusy(true);
    try {
      const k = await api.createApiKey({ label: label.trim(), scopes, ...(days ? { expiresInDays: Number(days) } : {}) });
      setFresh(k); setLabel(""); setDays(""); setCopied(false);
      list.reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function revoke(k) {
    if (!window.confirm(`Revoke "${k.label}"? Apps using it will stop working.`)) return;
    try { await api.revokeApiKey(k.id); list.reload(); } catch (err) { setError(err.message); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(fresh.key); setCopied(true); } catch { /* clipboard blocked */ }
  }

  const keys = list.data?.apiKeys || [];
  return (
    <>
      <div className="c row"><Icon n="key" s={20} c="var(--cy)" /><span><b>Keys are shown once.</b> <span className="mu">Only a secure hash and a short prefix are stored. Up to 10 active keys per workspace.</span></span></div>
      {fresh && (
        <div className="c nk" role="status">
          <b>Your new key (copy it now)</b>
          <code>{fresh.key}</code>
          <p className="mu sm">{fresh.notice}</p>
          <button type="button" className="b" onClick={copy}>{copied ? "Copied" : "Copy key"}</button>
        </div>
      )}
      <State loading={list.loading} error={list.error}>
        <div className="tw c">
          <table>
            <thead><tr><th>Label</th><th>Prefix</th><th>Scopes</th><th>Status</th><th>Expires</th><th>Created</th><th /></tr></thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td><b>{k.label}</b></td><td><code>{k.prefix}</code></td>
                  <td><code>{(k.scopes || []).join(", ")}</code></td>
                  <td><Pill t={k.status} /></td>
                  <td>{k.expiresAt ? shortDate(k.expiresAt) : "Never"}</td><td>{shortDate(k.createdAt)}</td>
                  <td>{k.status === "active" && <button type="button" className="b" onClick={() => revoke(k)}>Revoke</button>}</td>
                </tr>
              ))}
              {!keys.length && <tr><td colSpan="7" className="mu">No API keys yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </State>
      <form className="c" onSubmit={create}>
        <b>Create API key</b>
        <div className="frm" style={{ margin: "12px 0" }}>
          <input placeholder="Label, e.g. Website integration" aria-label="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input type="number" min="1" placeholder="Expires in days (optional)" aria-label="Expires in days" value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
        <div className="cps" role="group" aria-label="Scopes">
          {SCOPES.map((s) => <label className="chk cp" key={s}><input type="checkbox" checked={scopes.includes(s)} onChange={() => toggle(s)} /> {s}</label>)}
        </div>
        {error && <p className="er" role="alert">{error}</p>}
        <p><button type="submit" className="b bp" disabled={busy}>Create key</button></p>
      </form>
    </>
  );
}
