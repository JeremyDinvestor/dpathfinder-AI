import { Router } from "express";
import { chat } from "../controllers/chatController.js";
import { authenticateAny } from "../middleware/authenticate.js";
import { requireScope } from "../middleware/apiKeyAuth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { chatSchema } from "../validators/chatValidators.js";

const router = Router();
router.post("/", authenticateAny, requireScope("chat"), validateRequest({ body: chatSchema }), chat);
export default router;
