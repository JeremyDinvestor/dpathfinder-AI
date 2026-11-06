// Usage summary for the logged-in workspace.
import { asyncHandler, sendSuccess } from "../utils/responses.js";
import { getUsageSummary } from "../services/usageService.js";

export const summary = asyncHandler(async (req, res) => {
  sendSuccess(res, await getUsageSummary(req.auth.workspaceId, req.validated.query.days));
});
