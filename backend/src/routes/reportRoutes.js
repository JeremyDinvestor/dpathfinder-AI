import { Router } from "express";
import { businessSummary } from "../controllers/reportController.js";
import { authenticateAny } from "../middleware/authenticate.js";
import { requireScope } from "../middleware/apiKeyAuth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { reportSchema } from "../validators/orderValidators.js";

const router = Router();
router.post("/business-summary", authenticateAny, requireScope("reports:read"), validateRequest({ body: reportSchema }), businessSummary);
export default router;
