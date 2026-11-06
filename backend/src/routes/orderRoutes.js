import { Router } from "express";
import { listOrders, changeOrderStatus } from "../controllers/orderController.js";
import { authenticateAny } from "../middleware/authenticate.js";
import { requireScope } from "../middleware/apiKeyAuth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { listOrdersSchema, orderIdParamsSchema, updateOrderStatusSchema } from "../validators/orderValidators.js";

const router = Router();
router.get("/", authenticateAny, requireScope("orders:read"), validateRequest({ query: listOrdersSchema }), listOrders);
router.patch(
  "/:id/status",
  authenticateAny,
  requireScope("orders:write"),
  validateRequest({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  changeOrderStatus
);
export default router;
