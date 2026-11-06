// Order REST endpoints. They call the same tools the AI agent uses.
import { asyncHandler, sendSuccess } from "../utils/responses.js";
import { getOrders, updateOrderStatus } from "../tools/businessTools.js";

export const listOrders = asyncHandler(async (req, res) => {
  sendSuccess(res, await getOrders({ workspaceId: req.auth.workspaceId }, req.validated.query));
});

export const changeOrderStatus = asyncHandler(async (req, res) => {
  const result = await updateOrderStatus(
    { workspaceId: req.auth.workspaceId },
    { orderId: req.validated.params.id, status: req.validated.body.status }
  );
  sendSuccess(res, result);
});
