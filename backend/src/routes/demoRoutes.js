// Public routes - no login. Strongly rate limited and limited to demo data.
import { Router } from "express";
import { demoChat, demoReset } from "../controllers/demoController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { demoChatLimiter, demoResetLimiter } from "../middleware/rateLimiter.js";
import { chatSchema } from "../validators/chatValidators.js";

const router = Router();
router.post("/chat", demoChatLimiter, validateRequest({ body: chatSchema }), demoChat);
router.post("/reset", demoResetLimiter, demoReset);
export default router;
