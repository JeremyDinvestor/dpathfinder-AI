// Reads and checks environment variables (the values in your .env file).
// If something important is missing, the app stops immediately with a clear
// message instead of failing later in a confusing way.
import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "GEMINI_API_KEY", "JWT_SECRET", "API_KEY_SECRET"];

const missing = required.filter((name) => !process.env[name] || process.env[name].trim() === "");
const placeholders = required.filter((name) => (process.env[name] || "").includes("replace_me"));

if (missing.length > 0 || placeholders.length > 0) {
  console.error("\nConfiguration problem - the server cannot start.");
  if (missing.length > 0) console.error("Missing variables:", missing.join(", "));
  if (placeholders.length > 0) console.error("Still using placeholder values:", placeholders.join(", "));
  console.error("Fix your .env file (see .env.example) and try again.\n");
  process.exit(1);
}

const weakSecrets = ["JWT_SECRET", "API_KEY_SECRET"].filter((name) => process.env[name].length < 32);
if (weakSecrets.length > 0) {
  console.error(`\nConfiguration problem: ${weakSecrets.join(", ")} must be at least 32 characters long.\n`);
  process.exit(1);
}

// Turns an env variable into a whole number, or uses the fallback.
function int(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isNaN(value) ? fallback : value;
}

const nodeEnv = process.env.NODE_ENV || "development";

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: int("PORT", 5000),

  mongodbUri: process.env.MONGODB_URI,

  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  geminiTimeoutMs: int("GEMINI_TIMEOUT_MS", 30000),

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  apiKeySecret: process.env.API_KEY_SECRET,
  bcryptRounds: int("BCRYPT_ROUNDS", 12),

  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  demoResetCooldownMs: int("DEMO_RESET_COOLDOWN_SECONDS", 30) * 1000,

  rateLimits: {
    auth: { windowMs: 15 * 60 * 1000, limit: int("AUTH_RATE_LIMIT", 10) },
    demoChat: { windowMs: 15 * 60 * 1000, limit: int("DEMO_CHAT_RATE_LIMIT", 10) },
    demoReset: { windowMs: 60 * 60 * 1000, limit: int("DEMO_RESET_RATE_LIMIT", 3) },
    api: { windowMs: 15 * 60 * 1000, limit: int("API_RATE_LIMIT", 300) },
  },
};
