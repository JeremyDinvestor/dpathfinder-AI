// GET /health - is the server (and its database) alive?
import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const databaseUp = mongoose.connection.readyState === 1;
  res.status(databaseUp ? 200 : 503).json({
    status: databaseUp ? "ok" : "degraded",
    database: databaseUp ? "connected" : "disconnected",
    uptimeSeconds: Math.round(process.uptime()),
  });
});

export default router;
