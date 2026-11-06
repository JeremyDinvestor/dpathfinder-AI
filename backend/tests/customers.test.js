import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Customer from "../src/models/Customer.js";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db.js";
import { registerUser, registerSeededUser, bearer } from "./helpers/factories.js";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearDb);

describe("customers", () => {
  it("creates a customer and it persists", async () => {
    const { token, workspaceId } = await registerUser();
    const res = await request(app)
      .post("/api/v1/customers")
      .set(bearer(token))
      .send({ name: "Ngozi Eze", email: "Ngozi@Example.com", phone: "+234 800 111 2222" });
    expect(res.status).toBe(201);
    expect(res.body.data.customer.email).toBe("ngozi@example.com");

    const saved = await Customer.find({ workspace: workspaceId });
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe("Ngozi Eze");
  });

  it("rejects an invalid email, missing name and bad phone", async () => {
    const { token } = await registerUser();
    const send = (data) => request(app).post("/api/v1/customers").set(bearer(token)).send(data);
    expect((await send({ name: "A", email: "not-an-email" })).status).toBe(400);
    expect((await send({ email: "a@b.com" })).status).toBe(400);
    expect((await send({ name: "A", email: "a@b.com", phone: "abc" })).status).toBe(400);
  });

  it("rejects a duplicate email in the same workspace", async () => {
    const { token } = await registerUser();
    const data = { name: "Ngozi", email: "dup@example.com" };
    expect((await request(app).post("/api/v1/customers").set(bearer(token)).send(data)).status).toBe(201);
    const second = await request(app).post("/api/v1/customers").set(bearer(token)).send({ ...data, email: "DUP@example.com" });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("duplicate_email");
  });

  it("allows the same email in a different workspace", async () => {
    const a = await registerUser("a@example.com");
    const b = await registerUser("b@example.com");
    const data = { name: "Same Person", email: "same@example.com" };
    expect((await request(app).post("/api/v1/customers").set(bearer(a.token)).send(data)).status).toBe(201);
    expect((await request(app).post("/api/v1/customers").set(bearer(b.token)).send(data)).status).toBe(201);
  });

  it("lists with pagination and search", async () => {
    const { token } = await registerSeededUser();
    const page1 = await request(app).get("/api/v1/customers?limit=4&page=1").set(bearer(token));
    expect(page1.body.data.customers).toHaveLength(4);
    expect(page1.body.data.pagination).toMatchObject({ total: 6, totalPages: 2, page: 1, limit: 4 });

    const page2 = await request(app).get("/api/v1/customers?limit=4&page=2").set(bearer(token));
    expect(page2.body.data.customers).toHaveLength(2);

    const search = await request(app).get("/api/v1/customers?search=okafor").set(bearer(token));
    expect(search.body.data.customers).toHaveLength(1);
    expect(search.body.data.customers[0].name).toBe("Adaeze Okafor");
  });

  it("treats search text literally (no regex injection) and validates query values", async () => {
    const { token } = await registerSeededUser();
    const regexy = await request(app).get("/api/v1/customers?search=.*").set(bearer(token));
    expect(regexy.status).toBe(200);
    expect(regexy.body.data.customers).toHaveLength(0);

    expect((await request(app).get("/api/v1/customers?limit=9999").set(bearer(token))).status).toBe(400);
    expect((await request(app).get("/api/v1/customers?page=0").set(bearer(token))).status).toBe(400);
  });
});
