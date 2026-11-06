// Authenticated chat (login token or API key with the "chat" scope).
import { asyncHandler, sendSuccess } from "../utils/responses.js";
import { handleChat } from "../services/agentService.js";

export const chat = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.validated.body;
  const result = await handleChat({
    message,
    conversationId,
    workspaceId: req.auth.workspaceId,
    scopes: req.auth.scopes,
    userId: req.auth.userId,
    apiKeyId: req.auth.apiKeyId,
    endpoint: "/api/v1/chat",
  });
  sendSuccess(res, result);
});
