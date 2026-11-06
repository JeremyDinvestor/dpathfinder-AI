// Gate D: API keys.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import ApiKey from "../src/models/ApiKey.js";
import { hashApiKey } from "../src/utils/hash.js";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db.js";
import { registerSeededUser, createKey, bearer } from "./helpers/factories.js";

beforeAll(startTestDb);
afterAll(stopTestDb);

let user;
beforeEach(async () => {
  await clearDb();
  user = await registerSeededUser("dev@example.com");
});

describe("API keys", () => {
  it("shows the raw key only once and stores only a hash", async () => {
    const created = await createKey(user.token);
    expect(created.status).toBe(201);
    const { key, id, prefix } = created.body.data;
    expect(key).toMatch(/^dpf_/);
    expect(key.startsWith(prefix)).toBe(true);

    const list = await request(app).get("/api/v1/api-keys").set(bearer(user.token));
    expect(list.status).toBe(200);
    expect(list.body.data.apiKeys).toHaveLength(1);
    expect(JSON.stringify(list.body)).not.toContain(key);
    expect(JSON.stringify(list.body)).not.toMatch(/keyHash/);

    const stored = await ApiKey.findById(id).select("+keyHash");
    expect(stored.keyHash).not.toBe(key);
    expect(stored.keyHash).toBe(hashApiKey(key));
  });

  it("a valid key works via x-api-key and via Bearer, and records last use", async () => {
    const { key, id } = (await createKey(user.token)).body.data;
    const viaHeader = await request(app).get("/api/v1/customers").set("x-api-key", key);
    expect(viaHeader.status).toBe(200);
    expect(viaHeader.body.data.customers).toHaveLength(6);
    const viaBearer = await request(app).get("/api/v1/orders").set(bearer(key));
    expect(viaBearer.status).toBe(200);

    await new Promise((r) => setTimeout(r, 100)); // lastUsedAt is saved in the background
    expect((await ApiKey.findById(id)).lastUsedAt).toBeTruthy();
  });

  it("rejects wrong, malformed and missing keys", async () => {
    const { key } = (await createKey(user.token)).body.data;
    const wrong = await request(app).get("/api/v1/customers").set("x-api-key", key.slice(0, -2) + "xx");
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe("invalid_api_key");
    expect((await request(app).get("/api/v1/customers").set("x-api-key", "garbage")).status).toBe(401);
    expect((await request(app).get("/api/v1/customers")).status).toBe(401);
  });

  it("rejects revoked keys", async () => {
    const { key, id } = (await createKey(user.token)).body.data;
    const revoke = await request(app).delete(`/api/v1/api-keys/${id}`).set(bearer(user.token));
    expect(revoke.status).toBe(200);
    expect(revoke.body.data.apiKey.status).toBe("revoked");
    expect((await request(app).get("/api/v1/customers").set("x-api-key", key)).status).toBe(401);
    // revoking twice is a 404
    expect((await request(app).delete(`/api/v1/api-keys/${id}`).set(bearer(user.token))).status).toBe(404);
  });

  it("rejects expired keys", async () => {
    const { key, id } = (await createKey(user.token, { expiresInDays: 1 })).body.data;
    expect((await request(app).get("/api/v1/customers").set("x-api-key", key)).status).toBe(200);
    await ApiKey.updateOne({ _id: id }, { expiresAt: new Date(Date.now() - 1000) });
    expect((await request(app).get("/api/v1/customers").set("x-api-key", key)).status).toBe(401);
    const list = await request(app).get("/api/v1/api-keys").set(bearer(user.token));
    expect(list.body.data.apiKeys[0].status).toBe("expired");
  });

  it("enforces scopes", async () => {
    const { key } = (await createKey(user.token, { scopes: ["orders:read"] })).body.data;
    expect((await request(app).get("/api/v1/orders").set("x-api-key", key)).status).toBe(200);
    const customers = await request(app).get("/api/v1/customers").set("x-api-key", key);
    expect(customers.status).toBe(403);
    expect(customers.body.error.code).toBe("insufficient_scope");
    expect((await request(app).post("/api/v1/chat").set("x-api-key", key).send({ message: "hi" })).status).toBe(403);
    const create = await request(app).post("/api/v1/customers").set("x-api-key", key).send({ name: "X", email: "x@example.com" });
    expect(create.status).toBe(403);
  });

  it("defaults to read-only scopes and validates input", async () => {
    const created = await createKey(user.token);
    expect(created.body.data.scopes).toEqual(["chat", "customers:read", "orders:read", "reports:read"]);
    expect((await createKey(user.token, { label: "" })).status).toBe(400);
    expect((await createKey(user.token, { scopes: ["admin"] })).status).toBe(400);
    expect((await createKey(user.token, { expiresInDays: 9999 })).status).toBe(400);
  });

  it("an API key cannot manage API keys or read usage", async () => {
    const { key } = (await createKey(user.token)).body.data;
    expect((await request(app).get("/api/v1/api-keys").set("x-api-key", key)).status).toBe(401);
    expect((await request(app).post("/api/v1/api-keys").set("x-api-key", key).send({ label: "x" })).status).toBe(401);
    expect((await request(app).get("/api/v1/usage").set("x-api-key", key)).status).toBe(401);
  });

  it("limits the number of active keys", async () => {
    for (let i = 0; i < 10; i++) expect((await createKey(user.token)).status).toBe(201);
    expect((await createKey(user.token)).status).toBe(409);
  });

  it("a user cannot revoke another workspace's key", async () => {
    const { id } = (await createKey(user.token)).body.data;
    const other = await registerSeededUser("other-dev@example.com");
    expect((await request(app).delete(`/api/v1/api-keys/${id}`).set(bearer(other.token))).status).toBe(404);
    expect((await request(app).get("/api/v1/api-keys").set(bearer(other.token))).body.data.apiKeys).toHaveLength(0);
  });
});
