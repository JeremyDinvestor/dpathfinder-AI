// Small helpers used everywhere so API responses always look the same.

// An error we expect and can explain to the caller (wrong input, not found...).
// The message is safe to show to users.
export class AppError extends Error {
  constructor(status, message, code = "error", details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Success shape: { success: true, data: ... }
export function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

// Express 4 does not catch errors thrown in async functions by itself.
// Wrapping a handler with this sends those errors to our error handler.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
