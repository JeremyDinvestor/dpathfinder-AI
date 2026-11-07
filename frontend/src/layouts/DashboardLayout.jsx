import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, Logo, ThemeButton } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  ["/dashboard", "Overview", "home", true],
  ["/dashboard/playground", "AI Playground", "chat"],
  ["/dashboard/customers", "Customers", "users"],
  ["/dashboard/orders", "Orders", "box"],
  ["/dashboard/reports", "Reports", "chart"],
  ["/dashboard/api-keys", "API Keys", "key"],
  ["/dashboard/usage", "Usage", "act"],
  ["/dashboard/settings", "Settings", "gear"],
];

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  useEffect(() => setOpen(false), [pathname]);

  const title = (NAV.find(([to]) => to === pathname) || NAV[0])[1];
  const initial = (user?.displayName || user?.email || "U").trim()[0].toUpperCase();

  return (
    <div className="dl">
      <aside className={`sb ${open ? "open" : ""}`} aria-label="Dashboard">
        <div className="sbh"><Logo /></div>
        {NAV.map(([to, label, icon, end]) => (
          <NavLink key={to} to={to} end={!!end} className={({ isActive }) => `sn ${isActive ? "on" : ""}`}>
            <Icon n={icon} />{label}
          </NavLink>
        ))}
        <button type="button" className="sn out linkbtn" onClick={logout}>Log out</button>
      </aside>
      <div className="dm">
        <div className="dh">
          <button type="button" className="ib burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><Icon n="menu" /></button>
          <h1>{title}</h1>
          <span className="sp" />
          <ThemeButton />
          <details className="dd" key={pathname}>
            <summary className="av" aria-label="Account menu">{initial}</summary>
            <div className="dmn">
              <Link to="/dashboard/settings">Settings</Link>
              <button type="button" className="linkbtn" onClick={logout}>Log out</button>
            </div>
          </details>
        </div>
        <div className="db"><Outlet /></div>
      </div>
    </div>
  );
}
