import DevTabs from "../../components/DevTabs.jsx";
import { useTitle } from "../../hooks.js";

const ENDPOINTS = [
  ["POST", "/api/v1/chat", "chat"],
  ["GET", "/api/v1/customers", "customers:read"],
  ["POST", "/api/v1/customers", "customers:write"],
  ["GET", "/api/v1/orders", "orders:read"],
  ["PATCH", "/api/v1/orders/:id/status", "orders:write"],
  ["POST", "/api/v1/reports/business-summary", "reports:read"],
];

export default function Docs() {
  useTitle("Documentation");
  return (
    <section className="sec">
      <h1 className="h1">Documentation</h1>
      <p className="lead">Create an API key in your dashboard, then send it in the <code>x-api-key</code> header. The key is shown once.</p>
      <DevTabs />
      <h2 style={{ marginTop: 32 }}>Endpoints</h2>
      <div className="tw">
        <table>
          <thead><tr><th>Method</th><th>Path</th><th>Scope</th></tr></thead>
          <tbody>{ENDPOINTS.map(([m, p, s]) => <tr key={m + p}><td className="cy">{m}</td><td><code>{p}</code></td><td><code>{s}</code></td></tr>)}</tbody>
        </table>
      </div>
      <h2 style={{ marginTop: 32 }}>Responses</h2>
      <p className="mu">Every response uses the same envelope. Success returns <code>{'{"success":true,"data":…}'}</code>. Errors return <code>{'{"success":false,"error":{"code","message"}}'}</code> with a clear message, such as <code>duplicate_email</code> or <code>invalid_transition</code>.</p>
      <h2>Limits</h2>
      <ul className="pts">
        <li>Messages are limited to 1,000 characters and request bodies to 10 KB.</li>
        <li>API requests are limited to 300 per 15 minutes per IP address.</li>
        <li>The public demo allows 10 chat messages per 15 minutes, and demo resets are rate limited to protect the shared data.</li>
        <li>Send the <code>conversationId</code> from a reply to continue the same conversation.</li>
      </ul>
    </section>
  );
}
