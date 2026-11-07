import { Icon } from "./ui.jsx";

// Marketing illustrations. These show SAMPLE content only and never claim to be live data.
const COLS = [
  ["pending", [["ORD-1001", "Adaeze Okafor", "₦62,500"], ["ORD-1004", "Ibrahim Musa", "₦55,000"]]],
  ["processing", [["ORD-1002", "Tunde Bakare", "₦90,000"], ["ORD-1005", "Ngozi Obi", "₦58,000"]]],
  ["shipped", [["ORD-1006", "Femi Adeyemi", "₦50,000"], ["ORD-1008", "Tunde Bakare", "₦35,000"]]],
  ["delivered", [["ORD-1003", "Chioma Eze", "₦150,000"], ["ORD-1007", "Adaeze Okafor", "₦100,000"], ["ORD-1009", "Chioma Eze", "₦70,000"]]],
];
const BARS = [["pending", "₦117,500 · 2", 33], ["processing", "₦148,000 · 2", 33], ["shipped", "₦85,000 · 2", 33], ["delivered", "₦320,000 · 3", 50], ["cancelled", "₦38,000 · 1", 17]];

export const ChatIllustration = () => (
  <div className="il">
    <div className="mu1">Show me pending orders</div>
    <div className="ma">You have 2 pending orders worth ₦117,500: ORD-1001 for Adaeze Okafor and ORD-1004 for Ibrahim Musa.
      <div><span className="tag" style={{ margin: "8px 0 0" }}><Icon n="box" s={14} c="var(--cy)" /> getOrders ✓</span></div></div>
    <div className="mu1">Move ORD-1001 to processing</div>
    <div className="ma">Done. ORD-1001 is now processing.
      <div><span className="tag" style={{ margin: "8px 0 0" }}><Icon n="sync" s={14} c="var(--cy)" /> updateOrderStatus ✓</span></div></div>
    <div className="ilin">Ask the agent…</div>
  </div>
);

export const OrdersIllustration = () => (
  <div className="il"><div className="kb">
    {COLS.map(([st, rows]) => (
      <div className="kcol" key={st}>
        <div className="kh">{st}</div>
        {rows.map(([id, who, amt]) => (
          <div className={`kc${st === "delivered" ? " ok" : ""}`} key={id}><code>{id}</code><span>{who}</span><b>{amt}</b></div>
        ))}
      </div>
    ))}
  </div></div>
);

export const ReportIllustration = () => (
  <div className="il">
    <div className="g2s">
      <div><div className="mu sm">Revenue</div><div className="big">₦320,000</div></div>
      <div><div className="mu sm">Pipeline</div><div className="big">₦350,500</div></div>
    </div>
    {BARS.map(([k, v, w]) => (
      <div className="bar" key={k}><span>{k}</span><i><u style={{ width: `${w}%` }} /></i><em>{v}</em></div>
    ))}
  </div>
);

export const KeysIllustration = () => (
  <div className="il">
    <div className="kk"><div className="mu sm">API key · shown once</div><code>dpf_a1b2••••••••••••</code></div>
    <div className="cps">{["chat", "customers:read", "orders:read", "reports:read"].map((s) => <span className="cp" key={s}>{s}</span>)}</div>
    <p className="mu sm" style={{ margin: 0 }}>Stored as a secure hash. Revoke any time.</p>
  </div>
);

export const FeatureRow = ({ title, copy, points, children, reverse }) => (
  <div className={`fr${reverse ? " rev" : ""}`}>
    <div>
      <h3>{title}</h3>
      <p className="mu">{copy}</p>
      <ul className="pts">{points.map((p) => <li key={p}>{p}</li>)}</ul>
    </div>
    <div>{children}</div>
  </div>
);
