import Chat from "../../components/Chat.jsx";
import { useTitle } from "../../hooks.js";
import { api } from "../../services/api.js";

export default function DashPlayground() {
  useTitle("AI Playground");
  return <Chat inline send={api.chat} storageKey="dpf_workspace_conversation" intro="Hi, I’m the DPathfinder agent. I work in your own workspace. Ask me about your customers, orders or reports." />;
}
