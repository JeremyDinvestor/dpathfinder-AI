import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db.js";
import { bearer } from "./helpers/factories.js";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearDb);

const body = { email: "Ada@Example.com", password: "Password123", displayName: "Ada" };

describe("register", () => {
  it("creates a user and workspace, hides the password hash", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(body);
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe("ada@example.com"); // lowercased
    expect(res.body.data.workspace.id).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);

    const stored = await User.findOne({ email: "ada@example.com" }).select("+passwordHash");
    expect(stored.passwordHash).not.toBe("Password123"); // never plaintext
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/v1/auth/register").send(body);
    const res = await request(app).post("/api/v1/auth/register").send(body);
    expect(res.status).toBe(409);
  });

  it("rejects an invalid email and a weak password", async () => {
    const bad = await request(app).post("/api/v1/auth/register").send({ ...body, email: "nope" });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe("validation_error");

    const weak = await request(app).post("/api/v1/auth/register").send({ ...body, password: "123" });
    expect(weak.status).toBe(400);
  });
});

describe("login and protected routes", () => {
  it("logs in with the right password", async () => {
    await request(app).post("/api/v1/auth/register").send(body);
    const res = await request(app).post("/api/v1/auth/login").send({ email: "ada@example.com", password: "Password123" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it("gives the same generic error for a wrong password and an unknown email", async () => {
    await request(app).post("/api/v1/auth/register").send(body);
    const wrong = await request(app).post("/api/v1/auth/login").send({ email: "ada@example.com", password: "Wrong-pass1" });
    const unknown = await request(app).post("/api/v1/auth/login").send({ email: "ghost@example.com", password: "Wrong-pass1" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it("protects routes: no token and bad token are rejected", async () => {
    const none = await request(app).get("/api/v1/customers");
    expect(none.status).toBe(401);
    const bad = await request(app).get("/api/v1/customers").set(bearer("not-a-real-token"));
    expect(bad.status).toBe(401);
  });

  it("accepts a valid token", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send(body);
    const res = await request(app).get("/api/v1/customers").set(bearer(reg.body.data.token));
    expect(res.status).toBe(200);
    expect(res.body.data.customers).toEqual([]);
  });

  it("rejects a token for a user that no longer exists", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send(body);
    await User.deleteMany({});
    const res = await request(app).get("/api/v1/customers").set(bearer(reg.body.data.token));
    expect(res.status).toBe(401);
  });
});
