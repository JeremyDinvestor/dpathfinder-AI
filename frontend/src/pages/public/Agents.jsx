import { FeatureRow } from "../../components/Illustrations.jsx";
import { Icon } from "../../components/ui.jsx";
import { useTitle } from "../../hooks.js";
import profileDark from "../../assets/profile-dark.jpg";
import profileLight from "../../assets/profile-light.jpg";

const TOOLS = [
  ["getCustomers", "users", "Looks up customers, with search and pages.", "customers:read"],
  ["createCustomer", "user2", "Adds a customer. Duplicate emails are rejected.", "customers:write"],
  ["getOrders", "box", "Lists orders by status or customer.", "orders:read"],
  ["updateOrderStatus", "sync", "Moves an order along its allowed flow.", "orders:write"],
  ["generateBusinessReport", "chart", "Summarises revenue, pipeline and cancellations.", "reports:read"],
];

export default function Agents() {
  useTitle("Explore Agents");
  return (
    <section className="sec">
      <span className="tag">Explore agents</span>
      <h1 className="h1">Business Operations Agent</h1>
      <p className="lead">One agent, five controlled tools. Each is checked against your workspace and your key’s scopes before it runs. Ask in plain language and the agent chooses the right tool, so there is nothing to learn and no screens to hunt through.</p>
      <FeatureRow title="An agent that works the way you speak." copy="Describe the outcome you want. The agent chooses the tool, runs it through your backend and tells you what happened." points={["No menus to learn", "Plain-language answers, with the tools shown", "Built on your own customers and orders"]}>
        <div className="pic">
          <img className="thd" src={profileDark} alt="A digital illustration of a human profile made of light and circuits" />
          <img className="thl" src={profileLight} alt="A digital illustration of a human profile made of light and circuits" />
        </div>
      </FeatureRow>
      <div className="g3">
        {TOOLS.map(([name, icon, desc, scope]) => (
          <div className="c" key={name}>
            <Icon n={icon} s={24} c="var(--cy)" />
            <code className="nm">{name}</code>
            <p className="mu">{desc}</p>
            <code className="cy">{scope}</code>
          </div>
        ))}
      </div>
      <div className="c mu">The AI can only request tools. Your backend validates and runs them, and the workspace comes from your login or key, never from the chat.</div>
    </section>
  );
}
