import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { startTestDb, stopTestDb } from "./helpers/db.js";

beforeAll(startTestDb);
afterAll(stopTestDb);

describe("health and safe errors", () => {
  it("GET /health reports the database is connected", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.database).toBe("connected");
  });

  it("unknown routes return a JSON 404", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("not_found");
  });

  it("invalid JSON returns 400 without a stack trace", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": broken');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_json");
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/);
  });

  it("rejects oversized request bodies", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "a@b.com", password: "x".repeat(20000) });
    expect(res.status).toBe(413);
  });

  it("only sends CORS headers to allowed origins", async () => {
    const allowed = await request(app).get("/health").set("Origin", "http://localhost:5173");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");

    const blocked = await request(app).get("/health").set("Origin", "http://evil.example");
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
