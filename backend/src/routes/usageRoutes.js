import { Router } from "express";
import { summary } from "../controllers/usageController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { usageQuerySchema } from "../validators/apiKeyValidators.js";

const router = Router();
router.get("/", authenticate, validateRequest({ query: usageQuerySchema }), summary);
export default router;
