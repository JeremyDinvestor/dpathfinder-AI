import { Link } from "react-router-dom";
import HeroBackdrop from "../../components/HeroBackdrop.jsx";
import DevTabs from "../../components/DevTabs.jsx";
import { ChatIllustration, FeatureRow, KeysIllustration, OrdersIllustration, ReportIllustration } from "../../components/Illustrations.jsx";
import { Icon } from "../../components/ui.jsx";
import { useTitle } from "../../hooks.js";

const STEPS = [
  ["01", "Ask in plain language", "Type what you need, such as “list my customers”."],
  ["02", "The agent picks a tool", "It can only request one of five controlled tools."],
  ["03", "The backend runs it", "Your workspace is checked, then you get a clear answer."],
];
const CAPS = [["users", "View customers"], ["user2", "Create customers"], ["box", "View orders"], ["sync", "Update orders"], ["chart", "Business reports"]];
const CASES = [
  ["Online shops", "See what is waiting to ship and update statuses from a single chat, without opening another screen."],
  ["Service businesses", "Keep customer details tidy and find a client in seconds by name or email."],
  ["Small teams", "Get this week’s revenue and pipeline on request, with no spreadsheet to maintain."],
];
const FLOW = [["You", "Natural language"], ["Agent", "Requests a tool"], ["Your backend", "Validates and runs"], ["MongoDB", "Workspace data"]];

export default function Home() {
  useTitle("");
  return (
    <>
      <section className="hero">
        <HeroBackdrop />
        <div className="hc">
          <span className="tag">AI business operations agent</span>
          <h1>Your business operations. <b>Powered by AI.</b></h1>
          <p className="lead">Stop clicking through spreadsheets and menus. Ask for what you need in plain language, like “which orders are still pending?” or “add a new customer”, and DPathfinder carries it out, then shows you exactly what it did.</p>
          <Link className="b bp" to="/playground">Try the live demo</Link> <Link className="b" to="/register">Create account</Link>
        </div>
      </section>

      <section className="sec pv">
        <div className="c win">
          <div className="wb"><i /><i /><i /><span className="mu sm">DPathfinder AI · sample conversation</span></div>
          <div className="mu1">Show me pending orders</div>
          <div className="ma">You have 2 pending orders worth ₦117,500.
            <div className="tag" style={{ margin: "8px 0 0" }}><Icon n="box" s={14} c="var(--cy)" /> getOrders ✓</div></div>
        </div>
      </section>

      <section className="sec">
        <h2>How it works</h2>
        <div className="g3">{STEPS.map(([n, t, d]) => <div key={n}><em>{n}</em><b>{t}</b><p className="mu">{d}</p></div>)}</div>
      </section>

      <section className="sec">
        <h2>What the agent can do</h2>
        <p className="mu" style={{ margin: "0 0 20px" }}>Five controlled tools cover the everyday work of running a small business.</p>
        <div className="g5">{CAPS.map(([i, t]) => <div className="c" key={t}><Icon n={i} s={22} c="var(--cy)" /><b>{t}</b></div>)}</div>
      </section>

      <section className="sec">
        <FeatureRow title="Ask once. Get a clear answer." copy="Type what you need the way you would say it to a colleague. The agent works out which tool to use, runs it, and replies in plain language." points={["Customers, orders and reports in one conversation", "Asks for missing details instead of guessing", "Says plainly when something fails"]}><ChatIllustration /></FeatureRow>
        <FeatureRow reverse title="Orders that move the right way." copy="Status changes follow the same rules everywhere. An order can only move forward along its path, so a delivered order cannot be quietly changed." points={["Pending, processing, shipped, delivered", "Cancel only from pending or processing", "Every change confirmed by the tool, never assumed"]}><OrdersIllustration /></FeatureRow>
        <FeatureRow title="Reports you can trust." copy="Revenue, pipeline and cancellations are calculated from your orders, so the figures in chat match the figures on your dashboard." points={["Revenue counts delivered orders", "Pipeline covers pending, processing and shipped", "Optional date range"]}><ReportIllustration /></FeatureRow>
        <FeatureRow reverse title="Keys built for developers." copy="Give your own app access with scoped API keys. Each key can only do what its scopes allow." points={["Shown once, stored as a secure hash", "Six scopes, from chat to reports", "Revoke any time"]}><KeysIllustration /></FeatureRow>
      </section>

      <section className="sec">
        <h2>Built for businesses that run on orders</h2>
        <div className="g3">{CASES.map(([t, d]) => <div className="c uc" key={t}><h3>{t}</h3><p className="mu">{d}</p></div>)}</div>
      </section>

      <section className="sec">
        <h2>How DPathfinder connects your operations</h2>
        <p className="mu">The agent never touches your database. It requests tools, and your backend decides.</p>
        <div className="c">
          <svg viewBox="0 0 860 150" width="100%" role="img" aria-label="Flow from you to the agent, your backend and your database">
            {FLOW.map(([a, b], i) => {
              const x = 10 + i * 230;
              return (
                <g key={a}>
                  <rect x={x} y="45" width="150" height="64" rx="8" fill="var(--sf)" stroke={i === 2 ? "var(--cy)" : "var(--bd)"} />
                  <text x={x + 75} y="73" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--tx)">{a}</text>
                  <text x={x + 75} y="93" textAnchor="middle" fontSize="12" fill="var(--mu)">{b}</text>
                </g>
              );
            })}
            {[160, 390, 620].map((x) => <path key={x} d={`M${x} 77H${x + 80}M${x + 72} 71l8 6-8 6`} fill="none" stroke="var(--cy)" strokeWidth="1.75" />)}
            <text x="545" y="136" textAnchor="middle" fontSize="12" fill="var(--mu)">Checks input, scope and workspace</text>
          </svg>
        </div>
      </section>

      <section className="sec">
        <div className="g2d">
          <div>
            <h2>Built for developers</h2>
            <p className="mu">Create a scoped API key, call the agent from your code, and see every tool it ran.</p>
            <Link className="b" to="/docs">Read the docs</Link>
          </div>
          <DevTabs />
        </div>
      </section>

      <section className="sec">
        <div className="c cta">
          <h2>Run your operations by asking.</h2>
          <p className="mu">Try the demo with no sign-up, or create your own workspace.</p>
          <Link className="b bp" to="/playground">Try the live demo</Link> <Link className="b" to="/register">Create account</Link>
        </div>
      </section>
    </>
  );
}
