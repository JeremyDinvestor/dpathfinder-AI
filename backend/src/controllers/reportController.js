// Business report endpoint.
import { asyncHandler, sendSuccess } from "../utils/responses.js";
import { generateBusinessReport } from "../tools/businessTools.js";

export const businessSummary = asyncHandler(async (req, res) => {
  sendSuccess(res, await generateBusinessReport({ workspaceId: req.auth.workspaceId }, req.validated.body));
});
