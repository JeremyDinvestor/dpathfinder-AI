import "dotenv/config";
// Runs before every test file. Forces safe test settings so tests can NEVER
// touch your real database or call the real Gemini API.
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/dpathfinder_unused_test";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.GEMINI_MODEL = "test-model";
process.env.JWT_SECRET = "test_jwt_secret_".padEnd(48, "x");
process.env.API_KEY_SECRET = "test_api_key_secret_".padEnd(48, "y");
process.env.BCRYPT_ROUNDS = "4"; // fast hashing for tests
process.env.DEMO_RESET_COOLDOWN_SECONDS = "0";
process.env.ALLOWED_ORIGINS = "http://localhost:5173";
// High limits so normal tests never hit them (ratelimit.test.js sets its own).
process.env.AUTH_RATE_LIMIT = "1000";
process.env.DEMO_CHAT_RATE_LIMIT = "1000";
process.env.DEMO_RESET_RATE_LIMIT = "1000";
process.env.API_RATE_LIMIT = "10000";
