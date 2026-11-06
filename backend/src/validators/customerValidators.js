// Rules for customer requests. The AI tools reuse these same rules.
import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ID.");

export const listCustomersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{5,30}$/, "Phone may only contain digits, spaces, + ( ) -")
    .optional(),
});
