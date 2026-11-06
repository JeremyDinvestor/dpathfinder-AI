// Hashing helpers for passwords and API keys.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

// ---- Passwords (bcrypt: slow on purpose, so guessing is expensive) ----
export function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptRounds);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Used when a login email does not exist, so the response takes about the same
// time as a real check (makes it harder to discover which emails are registered).
let dummyHash;
export async function fakePasswordCheck(password) {
  dummyHash ??= await bcrypt.hash("dummy-password-for-timing", env.bcryptRounds);
  await bcrypt.compare(password, dummyHash);
}

// ---- API keys ----
// Keys are long random strings, so a fast keyed hash (HMAC-SHA256) is enough.
// We store ONLY this hash, never the raw key.
export function hashApiKey(rawKey) {
  return crypto.createHmac("sha256", env.apiKeySecret).update(rawKey).digest("hex");
}

export function generateApiKey() {
  const rawKey = "dpf_" + crypto.randomBytes(32).toString("base64url");
  return {
    rawKey,
    prefix: rawKey.slice(0, 12), // safe to show: "dpf_" + 8 characters
    keyHash: hashApiKey(rawKey),
  };
}
