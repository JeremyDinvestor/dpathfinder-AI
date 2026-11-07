import { useState } from "react";
import { State, Stat } from "../../components/ui.jsx";
import { useAsync, useTitle } from "../../hooks.js";
import { api } from "../../services/api.js";

// byEndpoint may arrive as an object or an array. Handle both so the page never breaks.
const toRows = (v) => (Array.isArray(v) ? v.map((x) => [x.endpoint || x.name || "-", x]) : Object.entries(v || {}));

export default function Usage() {
  useTitle("Usage");
  const [days, setDays] = useState(30);
  const use = useAsync(() => api.usage(days), [days]);
  const d = use.data;
  const t = d?.totals;

  return (
    <>
      <div className="chips">
        {[7, 30, 90].map((n) => <button type="button" key={n} className={`chip${days === n ? " on" : ""}`} onClick={() => setDays(n)}>Last {n} days</button>)}
      </div>
      <State loading={use.loading} error={use.error}>
        {t && (
          <>
            <div className="g4">
              <Stat l="Requests" v={t.requests} />
              <Stat l="Successful" v={t.successful} />
              <Stat l="Failed" v={t.failed} />
              <Stat l="Tokens" v={t.totalTokens} s={`${t.promptTokens} prompt · ${t.outputTokens} output`} />
            </div>
            <div className="tw c">
              <table>
                <thead><tr><th>Endpoint</th><th>Details</th></tr></thead>
                <tbody>
                  {toRows(d.byEndpoint).map(([name, v]) => <tr key={name}><td><code>{name}</code></td><td>{typeof v === "object" ? JSON.stringify(v) : String(v)}</td></tr>)}
                  {!toRows(d.byEndpoint).length && <tr><td colSpan="2" className="mu">No requests in this period.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="mu sm">Usage is recorded for chat requests only.</p>
          </>
        )}
      </State>
    </>
  );
}
