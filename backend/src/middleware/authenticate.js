// Login-token (JWT) authentication for dashboard users.
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import { API_SCOPES } from "../models/ApiKey.js";
import { env } from "../config/env.js";
import { AppError, asyncHandler } from "../utils/responses.js";
import { apiKeyAuth } from "./apiKeyAuth.js";

function getBearerToken(req) {
  return (req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

// Requires a valid login token. Sets req.auth for the controllers.
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token || token.startsWith("dpf_")) {
    throw new AppError(401, "Authentication required. Send your login token as: Authorization: Bearer <token>", "unauthenticated");
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
  } catch {
    throw new AppError(401, "Invalid or expired token. Please log in again.", "invalid_token");
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active") {
    throw new AppError(401, "Invalid or expired token. Please log in again.", "invalid_token");
  }

  // The workspace is looked up from the USER - never taken from the request.
  const workspace = await Workspace.findOne({ owner: user._id, isDemo: false });
  if (!workspace || workspace.status !== "active") {
    throw new AppError(403, "Your workspace is not active.", "workspace_inactive");
  }

  req.auth = {
    type: "user",
    userId: user._id.toString(),
    workspaceId: workspace._id.toString(),
    scopes: [...API_SCOPES], // logged-in users can do everything in their own workspace
    apiKeyId: null,
  };
  next();
});

// Accepts EITHER an API key (x-api-key header, or "Bearer dpf_...") OR a login token.
export function authenticateAny(req, res, next) {
  const usesApiKey = Boolean(req.headers["x-api-key"]) || getBearerToken(req)?.startsWith("dpf_");
  return (usesApiKey ? apiKeyAuth : authenticate)(req, res, next);
}
