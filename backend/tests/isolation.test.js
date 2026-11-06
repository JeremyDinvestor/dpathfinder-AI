// Gate D: workspace A must never see or change workspace B's data.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Order from "../src/models/Order.js";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db.js";
import { registerSeededUser, createKey, bearer } from "./helpers/factories.js";

beforeAll(startTestDb);
afterAll(stopTestDb);

let a;
let b;
beforeEach(async () => {
  await clearDb();
  a = await registerSeededUser("a@example.com");
  b = await registerSeededUser("b@example.com");
});

const ids = (res, field) => res.body.data[field].map((x) => x.id);

describe("workspace isolation", () => {
  it("each workspace only lists its own customers and orders", async () => {
    const aCustomers = ids(await request(app).get("/api/v1/customers").set(bearer(a.token)), "customers");
    const bCustomers = ids(await request(app).get("/api/v1/customers").set(bearer(b.token)), "customers");
    expect(aCustomers).toHaveLength(6);
    expect(bCustomers).toHaveLength(6);
    expect(aCustomers.filter((id) => bCustomers.includes(id))).toHaveLength(0);

    const aOrders = ids(await request(app).get("/api/v1/orders?limit=50").set(bearer(a.token)), "orders");
    const bOrders = ids(await request(app).get("/api/v1/orders?limit=50").set(bearer(b.token)), "orders");
    expect(aOrders.filter((id) => bOrders.includes(id))).toHaveLength(0);
  });

  it("A cannot change B's order (it looks like it does not exist)", async () => {
    const bOrder = (await request(app).get("/api/v1/orders?status=pending").set(bearer(b.token))).body.data.orders[0];
    const res = await request(app).patch(`/api/v1/orders/${bOrder.id}/status`).set(bearer(a.token)).send({ status: "processing" });
    expect(res.status).toBe(404);
    expect((await Order.findById(bOrder.id)).status).toBe("pending");
  });

  it("a workspaceId sent by the client is ignored", async () => {
    const asA = await request(app)
      .get(`/api/v1/customers?workspaceId=${b.workspaceId}`)
      .set(bearer(a.token))
      .set("x-workspace-id", b.workspaceId);
    const aIds = ids(asA, "customers");
    const bIds = ids(await request(app).get("/api/v1/customers").set(bearer(b.token)), "customers");
    expect(aIds.filter((id) => bIds.includes(id))).toHaveLength(0);

    const created = await request(app)
      .post("/api/v1/customers")
      .set(bearer(a.token))
      .send({ name: "Sneaky", email: "sneaky@example.com", workspace: b.workspaceId, workspaceId: b.workspaceId });
    expect(created.status).toBe(201);
    const bNames = (await request(app).get("/api/v1/customers?search=sneaky").set(bearer(b.token))).body.data.customers;
    expect(bNames).toHaveLength(0);
    const aNames = (await request(app).get("/api/v1/customers?search=sneaky").set(bearer(a.token))).body.data.customers;
    expect(aNames).toHaveLength(1);
  });

  it("reports only count the caller's own workspace", async () => {
    await request(app).post("/api/v1/customers").set(bearer(b.token)).send({ name: "Extra", email: "extra@example.com" });
    const report = (await request(app).post("/api/v1/reports/business-summary").set(bearer(a.token)).send({})).body.data;
    expect(report.customerCount).toBe(6);
    expect(report.totalOrders).toBe(10);
  });

  it("an API key only reaches the workspace that created it", async () => {
    const { key } = (await createKey(a.token)).body.data;
    const res = await request(app).get("/api/v1/customers").set("x-api-key", key);
    const keyIds = ids(res, "customers");
    const aIds = ids(await request(app).get("/api/v1/customers").set(bearer(a.token)), "customers");
    expect(keyIds.sort()).toEqual(aIds.sort());
  });
});
