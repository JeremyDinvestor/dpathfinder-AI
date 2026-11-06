// Checks params / query / body against Zod schemas.
// Cleaned values are saved in req.validated.{params,query,body} - controllers
// should read from there, not from req.body directly.
import { AppError } from "../utils/responses.js";

export function validateRequest(schemas) {
  return (req, res, next) => {
    req.validated = req.validated || {};
    for (const part of ["params", "query", "body"]) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(part === "body" ? (req.body ?? {}) : req[part]);
      if (!result.success) {
        const details = result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
        return next(new AppError(400, "Validation failed.", "validation_error", details));
      }
      req.validated[part] = result.data;
    }
    next();
  };
}
