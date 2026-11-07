import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, Logo, Mark, ThemeButton } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [["/", "Home"], ["/agents", "Explore Agents"], ["/playground", "Playground"], ["/docs", "Documentation"]];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthed } = useAuth();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="top">
        <Logo />
        <button type="button" className="ib burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon n="menu" />
        </button>
        <nav className={open ? "open" : ""} aria-label="Main">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "on" : "")}>{label}</NavLink>
          ))}
          <span className="sp" />
          <ThemeButton />
          {isAuthed ? (
            <Link className="b bp" to="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link className="b" to="/login">Sign In</Link>
              <Link className="b bp" to="/register">Get Started</Link>
            </>
          )}
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="ft2">
        <div className="fg">
          <div>
            <div className="row"><Mark s={26} /><b>DPathfinder AI</b></div>
            <p className="mu sm">An AI agent that runs your customers, orders and reports from plain-language instructions, with every action controlled by your own backend.</p>
          </div>
          <div><b>Product</b><Link to="/">Home</Link><Link to="/agents">Explore Agents</Link><Link to="/playground">Live demo</Link></div>
          <div><b>Developers</b><Link to="/docs">Documentation</Link><Link to="/docs">API reference</Link><Link to="/register">Get an API key</Link></div>
          <div><b>Account</b><Link to="/login">Sign In</Link><Link to="/register">Create account</Link><Link to="/dashboard">Dashboard</Link></div>
        </div>
        <div className="fb">
          <span>© {new Date().getFullYear()} DPathfinder AI. All rights reserved.</span>
          <span>
            <button type="button" className="linkbtn" onClick={() => window.dispatchEvent(new Event("dpf-splash"))}>Replay intro</button>
            {" · "}Developer: Jeremiah Louis
          </span>
        </div>
      </footer>
    </>
  );
}
