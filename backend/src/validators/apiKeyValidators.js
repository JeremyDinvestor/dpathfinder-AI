// Rules for API key requests.
import { z } from "zod";
import { API_SCOPES } from "../models/ApiKey.js";
import { objectId } from "./customerValidators.js";

// If no scopes are requested we give the safe, read-only set.
export const DEFAULT_SCOPES = ["chat", "customers:read", "orders:read", "reports:read"];

export const createApiKeySchema = z.object({
  label: z.string().trim().min(1, "Label is required.").max(60),
  scopes: z.array(z.enum(API_SCOPES)).min(1).max(API_SCOPES.length).default(DEFAULT_SCOPES),
  expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
});

export const apiKeyIdParamsSchema = z.object({ id: objectId });

export const usageQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});
