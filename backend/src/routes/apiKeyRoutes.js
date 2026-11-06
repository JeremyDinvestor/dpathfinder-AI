import { Router } from "express";
import { create, list, revoke } from "../controllers/apiKeyController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createApiKeySchema, apiKeyIdParamsSchema } from "../validators/apiKeyValidators.js";

const router = Router();
router.use(authenticate); // login token only
router.post("/", validateRequest({ body: createApiKeySchema }), create);
router.get("/", list);
router.delete("/:id", validateRequest({ params: apiKeyIdParamsSchema }), revoke);
export default router;
