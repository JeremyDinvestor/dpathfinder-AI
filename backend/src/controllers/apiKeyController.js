// Developer API key management (login token required - an API key cannot manage keys).
import { asyncHandler, sendSuccess } from "../utils/responses.js";
import { createApiKey, listApiKeys, revokeApiKey } from "../services/apiKeyService.js";

export const create = asyncHandler(async (req, res) => {
  const key = await createApiKey({
    workspaceId: req.auth.workspaceId,
    userId: req.auth.userId,
    ...req.validated.body,
  });
  sendSuccess(res, { ...key, notice: "Copy this key now. For security it will never be shown again." }, 201);
});

export const list = asyncHandler(async (req, res) => {
  sendSuccess(res, { apiKeys: await listApiKeys(req.auth.workspaceId) });
});

export const revoke = asyncHandler(async (req, res) => {
  sendSuccess(res, { apiKey: await revokeApiKey(req.auth.workspaceId, req.validated.params.id) });
});
