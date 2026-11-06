// The last stop for every error. Sends a safe JSON message - never stack traces,
// secrets or database details.
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { AppError } from "../utils/responses.js";

export function notFound(req, res, next) {
  next(new AppError(404, "Route not found.", "not_found"));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let code = "server_error";
  let message = "Something went wrong on our side. Please try again.";
  let details;

  if (err instanceof AppError) {
    ({ status, code, message, details } = err);
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    code = "invalid_json";
    message = "The request body is not valid JSON.";
  } else if (err?.type === "entity.too.large") {
    status = 413;
    code = "payload_too_large";
    message = "The request body is too large.";
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    code = "invalid_value";
    message = "An ID or value in the request is not valid.";
  }

  // Full details go to the server log only (and only for real server errors).
  if (status >= 500 && !env.isTest) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, env.isProduction ? err.message : err.stack);
  }

  res.status(status).json({ success: false, error: { code, message, ...(details ? { details } : {}) } });
}
