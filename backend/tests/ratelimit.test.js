// Gate D: rate limits.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { startTestDb, stopTestDb } from "./helpers/db.js";

// This file sets small limits BEFORE the app is loaded (limits are read at startup).
process.env.AUTH_RATE_LIMIT = "3";
process.env.DEMO_CHAT_RATE_LIMIT = "2";
process.env.DEMO_RESET_RATE_LIMIT = "2";

let app;
beforeAll(async () => {
  await startTestDb();
  app = (await import("../src/app.js")).default;
});
afterAll(stopTestDb);

describe("rate limits", () => {
  it("limits login attempts per IP, with a safe JSON 429", async () => {
    const attempt = () => request(app).post("/api/v1/auth/login").send({ email: "x@example.com", password: "Whatever123" });
    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("rate_limited");
  });

  it("limits the public demo chat (blocked before any AI call is made)", async () => {
    // An invalid body fails validation (400) but still counts toward the limit.
    const attempt = () => request(app).post("/api/v1/demo/chat").send({});
    expect((await attempt()).status).toBe(400);
    expect((await attempt()).status).toBe(400);
    expect((await attempt()).status).toBe(429);
  });

  it("limits demo resets", async () => {
    const attempt = () => request(app).post("/api/v1/demo/reset");
    expect((await attempt()).status).toBe(200);
    expect((await attempt()).status).toBe(200);
    expect((await attempt()).status).toBe(429);
  });

  it("the limiter factory works on its own", async () => {
    const { createLimiter } = await import("../src/middleware/rateLimiter.js");
    const mini = express();
    mini.use(createLimiter({ windowMs: 60000, limit: 1 }));
    mini.get("/", (req, res) => res.send("ok"));
    expect((await request(mini).get("/")).status).toBe(200);
    expect((await request(mini).get("/")).status).toBe(429);
  });
});
