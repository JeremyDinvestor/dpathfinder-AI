import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db.js";
import { registerSeededUser, bearer } from "./helpers/factories.js";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearDb);

async function findOrder(token, orderNumber) {
  const res = await request(app).get("/api/v1/orders?limit=50").set(bearer(token));
  return res.body.data.orders.find((o) => o.orderNumber === orderNumber);
}

describe("orders", () => {
  it("filters by status", async () => {
    const { token } = await registerSeededUser();
    const res = await request(app).get("/api/v1/orders?status=pending").set(bearer(token));
    expect(res.body.data.orders).toHaveLength(2);
    expect(res.body.data.orders.every((o) => o.status === "pending")).toBe(true);
    expect(res.body.data.orders[0].customer.email).toContain("@example.com");
  });

  it("paginates (10 orders, 4 per page)", async () => {
    const { token } = await registerSeededUser();
    const get = (page) => request(app).get(`/api/v1/orders?limit=4&page=${page}`).set(bearer(token));
    const [p1, p2, p3] = [await get(1), await get(2), await get(3)];
    expect(p1.body.data.orders).toHaveLength(4);
    expect(p2.body.data.orders).toHaveLength(4);
    expect(p3.body.data.orders).toHaveLength(2);
    expect(p1.body.data.pagination).toMatchObject({ total: 10, totalPages: 3 });
    const ids = [...p1.body.data.orders, ...p2.body.data.orders, ...p3.body.data.orders].map((o) => o.id);
    expect(new Set(ids).size).toBe(10); // no order repeated or missing
  });

  it("filters by customer email", async () => {
    const { token } = await registerSeededUser();
    const res = await request(app).get("/api/v1/orders?customerEmail=adaeze.okafor@example.com").set(bearer(token));
    expect(res.body.data.orders.map((o) => o.orderNumber).sort()).toEqual(["ORD-1001", "ORD-1007"]);
  });

  it("updates an order status along an allowed path", async () => {
    const { token } = await registerSeededUser();
    const order = await findOrder(token, "ORD-1001"); // pending
    const res = await request(app).patch(`/api/v1/orders/${order.id}/status`).set(bearer(token)).send({ status: "processing" });
    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe("processing");
    expect(res.body.data.previousStatus).toBe("pending");
    expect((await findOrder(token, "ORD-1001")).status).toBe("processing");
  });

  it("rejects invalid transitions and leaves the order unchanged", async () => {
    const { token } = await registerSeededUser();
    const pending = await findOrder(token, "ORD-1001");
    const delivered = await findOrder(token, "ORD-1007");

    const skip = await request(app).patch(`/api/v1/orders/${pending.id}/status`).set(bearer(token)).send({ status: "delivered" });
    expect(skip.status).toBe(409);
    expect(skip.body.error.code).toBe("invalid_transition");

    const backwards = await request(app).patch(`/api/v1/orders/${delivered.id}/status`).set(bearer(token)).send({ status: "pending" });
    expect(backwards.status).toBe(409);

    expect((await findOrder(token, "ORD-1001")).status).toBe("pending");
    expect((await findOrder(token, "ORD-1007")).status).toBe("delivered");
  });

  it("validates the order id and the status value", async () => {
    const { token } = await registerSeededUser();
    const order = await findOrder(token, "ORD-1001");
    expect((await request(app).patch("/api/v1/orders/abc/status").set(bearer(token)).send({ status: "shipped" })).status).toBe(400);
    expect((await request(app).patch(`/api/v1/orders/${order.id}/status`).set(bearer(token)).send({ status: "flying" })).status).toBe(400);
    expect((await request(app).patch("/api/v1/orders/aaaaaaaaaaaaaaaaaaaaaaaa/status").set(bearer(token)).send({ status: "shipped" })).status).toBe(404);
  });
});

describe("business report", () => {
  it("matches the known sample data", async () => {
    const { token } = await registerSeededUser();
    const res = await request(app).post("/api/v1/reports/business-summary").set(bearer(token)).send({});
    expect(res.status).toBe(200);
    const r = res.body.data;
    expect(r.totalOrders).toBe(10);
    expect(r.customerCount).toBe(6);
    expect(r.byStatus.pending).toEqual({ count: 2, totalAmount: 117500 });
    expect(r.byStatus.processing).toEqual({ count: 2, totalAmount: 148000 });
    expect(r.byStatus.shipped).toEqual({ count: 2, totalAmount: 85000 });
    expect(r.byStatus.delivered).toEqual({ count: 3, totalAmount: 320000 });
    expect(r.byStatus.cancelled).toEqual({ count: 1, totalAmount: 38000 });
    expect(r.revenue).toBe(320000);
    expect(r.pipelineValue).toBe(350500);
    expect(r.averageOrderValue).toBe(74500); // (320000 + 350500) / 9 orders that are not cancelled
  });

  it("updates after a status change", async () => {
    const { token } = await registerSeededUser();
    const shipped = await findOrder(token, "ORD-1005");
    await request(app).patch(`/api/v1/orders/${shipped.id}/status`).set(bearer(token)).send({ status: "delivered" });
    const r = (await request(app).post("/api/v1/reports/business-summary").set(bearer(token)).send({})).body.data;
    expect(r.revenue).toBe(345000);
    expect(r.pipelineValue).toBe(325500);
  });

  it("supports a date range and rejects bad dates", async () => {
    const { token } = await registerSeededUser();
    const future = await request(app).post("/api/v1/reports/business-summary").set(bearer(token)).send({ fromDate: "2100-01-01" });
    expect(future.body.data.totalOrders).toBe(0);
    const bad = await request(app).post("/api/v1/reports/business-summary").set(bearer(token)).send({ fromDate: "not-a-date" });
    expect(bad.status).toBe(400);
  });
});
