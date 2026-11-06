// Builds the Express app (without starting it, so tests can use it too).
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import demoRoutes from "./routes/demoRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";
import usageRoutes from "./routes/usageRoutes.js";

const app = express();

// On Render the app sits behind a proxy; this makes req.ip the visitor's real IP
// (needed for correct rate limiting).
if (env.isProduction) app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(helmet());

// CORS: only the origins listed in ALLOWED_ORIGINS may call this API from a browser.
// Requests without an Origin header (curl, Postman, servers) are not affected.
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || env.allowedOrigins.includes(origin));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);

app.use(express.json({ limit: "10kb" })); // small limit: chat messages are short

app.use("/health", healthRoutes);

app.use("/api/v1", apiLimiter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/demo", demoRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/api-keys", apiKeyRoutes);
app.use("/api/v1/usage", usageRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
