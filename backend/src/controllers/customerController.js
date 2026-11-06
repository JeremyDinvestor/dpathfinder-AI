// Customer REST endpoints. They call the same tools the AI agent uses.
import { asyncHandler, sendSuccess } from "../utils/responses.js";
import { getCustomers, createCustomer } from "../tools/businessTools.js";

export const listCustomers = asyncHandler(async (req, res) => {
  sendSuccess(res, await getCustomers({ workspaceId: req.auth.workspaceId }, req.validated.query));
});

export const addCustomer = asyncHandler(async (req, res) => {
  sendSuccess(res, await createCustomer({ workspaceId: req.auth.workspaceId }, req.validated.body), 201);
});
