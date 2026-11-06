import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";

const router = Router();
router.post("/register", authLimiter, validateRequest({ body: registerSchema }), register);
router.post("/login", authLimiter, validateRequest({ body: loginSchema }), login);
export default router;
