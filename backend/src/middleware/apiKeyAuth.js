// API-key authentication for developers, plus the scope check.
import { verifyApiKey } from "../services/apiKeyService.js";
import { AppError, asyncHandler } from "../utils/responses.js";

export const apiKeyAuth = asyncHandler(async (req, res, next) => {
  const headerKey = req.headers["x-api-key"];
  const bearer = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1];
  const rawKey = typeof headerKey === "string" ? headerKey.trim() : bearer;

  const result = rawKey ? await verifyApiKey(rawKey) : null;
  if (!result) {
    // One generic message for wrong, expired and revoked keys.
    throw new AppError(401, "Invalid, expired or revoked API key.", "invalid_api_key");
  }

  req.auth = {
    type: "apiKey",
    userId: null,
    workspaceId: result.workspace._id.toString(),
    scopes: result.apiKey.scopes,
    apiKeyId: result.apiKey._id.toString(),
  };
  next();
});

// Use after authentication: allows the request only if the caller has this scope.
export const requireScope = (scope) => (req, res, next) => {
  if (req.auth?.scopes?.includes(scope)) return next();
  return next(new AppError(403, `Your API key does not have the "${scope}" permission.`, "insufficient_scope"));
};
