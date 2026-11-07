import { useState } from "react";

const CODE = {
  curl: `curl -X POST $BASE_URL/api/v1/chat \\
  -H "x-api-key: dpf_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Show pending orders"}'`,
  node: `const res = await fetch(BASE_URL + "/api/v1/chat", {
  method: "POST",
  headers: { "x-api-key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Show pending orders" }),
});
const data = await res.json();`,
  json: `{
  "success": true,
  "data": {
    "reply": "You have 2 pending orders.",
    "conversationId": "...",
    "toolCalls": [{ "name": "getOrders", "ok": true }]
  }
}`,
};
const TABS = [["curl", "cURL"], ["node", "Node.js"], ["json", "Response"]];

export default function DevTabs() {
  const [tab, setTab] = useState("curl");
  return (
    <div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, n]) => (
          <button type="button" role="tab" aria-selected={tab === k} key={k} className={`chip${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{n}</button>
        ))}
      </div>
      <pre className="code">{CODE[tab]}</pre>
    </div>
  );
}
