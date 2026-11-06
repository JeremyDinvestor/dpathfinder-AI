// Rules for the register and login request bodies (checked with Zod).
import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export const registerSchema = z.object({
  email,
  // bcrypt only uses the first 72 characters, so we cap the length there.
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
  displayName: z.string().trim().min(1, "Display name is required.").max(80),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required.").max(72),
});
