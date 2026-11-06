// Rate limits: how many requests one IP address may make in a time window.
// NOTE: counters live in server memory, so they reset when the server restarts.
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export function createLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: { code: "rate_limited", message: "Too many requests. Please slow down and try again later." },
      });
    },
  });
}

export const authLimiter = createLimiter(env.rateLimits.auth);
export const demoChatLimiter = createLimiter(env.rateLimits.demoChat);
export const demoResetLimiter = createLimiter(env.rateLimits.demoReset);
export const apiLimiter = createLimiter(env.rateLimits.api);
