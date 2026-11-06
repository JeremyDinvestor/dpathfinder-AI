// Public demo: chat and reset. Always uses the isolated demo workspace.
import { asyncHandler, sendSuccess } from "../utils/responses.js";
import { handleChat } from "../services/agentService.js";
import { ensureDemoData, resetDemoData } from "../services/demoService.js";
import { API_SCOPES } from "../models/ApiKey.js";

export const demoChat = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.validated.body;
  const workspace = await ensureDemoData(); // the workspace id comes from the server, not the request
  const result = await handleChat({
    message,
    conversationId,
    workspaceId: workspace._id.toString(),
    scopes: [...API_SCOPES],
    endpoint: "/api/v1/demo/chat",
  });
  sendSuccess(res, result);
});

export const demoReset = asyncHandler(async (req, res) => {
  const counts = await resetDemoData();
  sendSuccess(res, { message: "Demo data has been reset.", ...counts });
});
