import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

const PATHS = {
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  chat: "M4 5h16v11H9l-5 4z",
  users: "M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  user2: "M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 8v6M22 11h-6",
  box: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8",
  chart: "M5 20V10M12 20V4M19 20v-7",
  key: "M15 8a4 4 0 1 1-3.5 6L4 21v-3h3v-3h3l1.5-1.5",
  act: "M3 12h4l3-8 4 16 3-8h4",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M12 2v3M12 19v3M2 12h3M19 12h3",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
  plus: "M12 5v14M5 12h14",
  menu: "M4 6h16M4 12h16M4 18h16",
  sync: "M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4",
};

export const Icon = ({ n, s = 18, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={PATHS[n]} />
  </svg>
);

// The logo mark. The r1/r2/n1/n2 classes drive the hover animation defined in app.css.
export const Mark = ({ s = 28 }) => (
  <svg className="mk" width={s} height={s} viewBox="0 0 48 48" role="img" aria-label="DPathfinder AI">
    <circle className="r1" pathLength="1" cx="24" cy="24" r="15" fill="none" stroke="var(--ac)" strokeWidth="2.5" />
    <path className="r2" pathLength="1" d="M13.4 34.6C13.4 24 21 27 24 24S35 22 34.6 13.4" fill="none" stroke="var(--cy)" strokeWidth="3" strokeLinecap="round" />
    <circle className="n1" cx="13.4" cy="34.6" r="3.6" fill="var(--ac)" />
    <path className="n2" d="M34.6 6.8l3.4 6.6-3.4 6.6-3.4-6.6z" fill="var(--tx)" transform="rotate(45 34.6 13.4)" />
  </svg>
);

export const Logo = ({ s = 28 }) => (
  <Link className="logo" to="/">
    <Mark s={s} />
    <span>DPathfinder <b>AI</b></span>
  </Link>
);

export function ThemeButton() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const label = `Switch to ${dark ? "light" : "dark"} mode`;
  return (
    <button type="button" className="ib" onClick={toggle} aria-label={label} title={label}>
      <Icon n={dark ? "sun" : "moon"} />
    </button>
  );
}

export const Pill = ({ t }) => <span className={`pl ${t}`}>{t}</span>;

export const Stat = ({ l, v, s }) => (
  <div className="c">
    <div className="mu">{l}</div>
    <div className="big">{v}</div>
    {s && <div className="mu sm">{s}</div>}
  </div>
);

// Shows loading / error text, otherwise the page content.
export function State({ loading, error, children }) {
  if (loading) return <p className="mu" role="status">Loading…</p>;
  if (error) return <div className="c err" role="alert">{error}</div>;
  return children;
}

export function Pager({ p, onPage }) {
  if (!p) return null;
  return (
    <div className="pager">
      <span className="mu sm">Page {p.page} of {Math.max(p.totalPages, 1)} · {p.total} total</span>
      <span>
        <button type="button" className="b" disabled={p.page <= 1} onClick={() => onPage(p.page - 1)}>Previous</button>{" "}
        <button type="button" className="b" disabled={p.page >= p.totalPages} onClick={() => onPage(p.page + 1)}>Next</button>
      </span>
    </div>
  );
}

// Orders by status, as horizontal bars. `byStatus` is { status: { count, totalAmount } }.
export function StatusBars({ byStatus = {}, total = 0, currency }) {
  const order = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const money = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: currency || "NGN", maximumFractionDigits: 0 }).format(n || 0);
  return order.map((k) => {
    const row = byStatus[k] || { count: 0, totalAmount: 0 };
    const pct = total ? Math.round((row.count / total) * 100) : 0;
    return (
      <div className="bar" key={k}>
        <span>{k}</span>
        <i><u style={{ width: `${pct}%` }} /></i>
        <em>{money(row.totalAmount)} · {row.count}</em>
      </div>
    );
  });
}
