// The public demo must only ever touch demo data.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";

vi.mock("../src/services/geminiService.js", () => ({ generate: vi.fn() }));

import { generate } from "../src/services/geminiService.js";
import app from "../src/app.js";
import Customer from "../src/models/Customer.js";
import Order from "../src/models/Order.js";
import Workspace from "../src/models/Workspace.js";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db.js";
import { registerUser, bearer } from "./helpers/factories.js";
import { toolCallResponse, textResponse } from "./helpers/gemini.js";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  generate.mockReset();
  await clearDb();
});

async function demoOrder(orderNumber) {
  const ws = await Workspace.findOne({ isDemo: true });
  return Order.findOne({ workspace: ws._id, orderNumber });
}

describe("public demo", () => {
  it("works without login and creates the sample data on first use", async () => {
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "getCustomers", args: {} }))
      .mockResolvedValueOnce(textResponse("Here are the customers."));
    const res = await request(app).post("/api/v1/demo/chat").send({ message: "list customers" });
    expect(res.status).toBe(200);
    const output = generate.mock.calls[1][0].contents.at(-1).parts[0].functionResponse.response.output;
    expect(output.customers).toHaveLength(6);
  });

  it("demo chat never reads real user data", async () => {
    const user = await registerUser("real@example.com");
    await request(app).post("/api/v1/customers").set(bearer(user.token)).send({ name: "Secret Corp", email: "secret@corp.example" });

    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "getCustomers", args: { search: "secret" } }))
      .mockResolvedValueOnce(textResponse("none"));
    await request(app).post("/api/v1/demo/chat").send({ message: "find secret" });
    const output = generate.mock.calls[1][0].contents.at(-1).parts[0].functionResponse.response.output;
    expect(output.customers).toHaveLength(0);
    expect(JSON.stringify(generate.mock.calls)).not.toContain("Secret Corp");
  });

  it("demo changes never touch real user data", async () => {
    const user = await registerUser("real2@example.com");
    await request(app).post("/api/v1/customers").set(bearer(user.token)).send({ name: "Real Customer", email: "real@customer.example" });

    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "createCustomer", args: { name: "Demo Visitor", email: "visitor@example.com" } }))
      .mockResolvedValueOnce(textResponse("Created."));
    await request(app).post("/api/v1/demo/chat").send({ message: "add visitor" });

    const demoWs = await Workspace.findOne({ isDemo: true });
    expect(await Customer.countDocuments({ workspace: demoWs._id, email: "visitor@example.com" })).toBe(1);
    expect(await Customer.countDocuments({ workspace: user.workspaceId })).toBe(1); // untouched
    expect(await Customer.countDocuments({ workspace: user.workspaceId, email: "visitor@example.com" })).toBe(0);
  });

  it("reset restores the sample data and leaves real workspaces alone", async () => {
    const user = await registerUser("real3@example.com");
    await request(app).post("/api/v1/customers").set(bearer(user.token)).send({ name: "Keep Me", email: "keep@example.com" });

    // change a demo order through the agent
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "updateOrderStatus", args: { orderNumber: "ORD-1001", status: "processing" } }))
      .mockResolvedValueOnce(textResponse("Done."));
    await request(app).post("/api/v1/demo/chat").send({ message: "process ORD-1001" });
    expect((await demoOrder("ORD-1001")).status).toBe("processing");

    const reset = await request(app).post("/api/v1/demo/reset");
    expect(reset.status).toBe(200);
    expect(reset.body.data).toMatchObject({ customers: 6, orders: 10 });
    expect((await demoOrder("ORD-1001")).status).toBe("pending");

    expect(await Customer.countDocuments({ workspace: user.workspaceId })).toBe(1);
    expect(await Workspace.countDocuments({ isDemo: true })).toBe(1);
  });

  it("two resets at once do not duplicate the sample data", async () => {
    await Promise.all([request(app).post("/api/v1/demo/reset"), request(app).post("/api/v1/demo/reset")]);
    const ws = await Workspace.findOne({ isDemo: true });
    expect(await Customer.countDocuments({ workspace: ws._id })).toBe(6);
    expect(await Order.countDocuments({ workspace: ws._id })).toBe(10);
  });

  it("validates the demo message and has no way to pick a workspace", async () => {
    expect((await request(app).post("/api/v1/demo/chat").send({})).status).toBe(400);
    generate.mockResolvedValueOnce(textResponse("hi"));
    const res = await request(app).post("/api/v1/demo/chat").send({ message: "hi", workspaceId: "aaaaaaaaaaaaaaaaaaaaaaaa" });
    expect(res.status).toBe(200); // the extra field is simply ignored
  });
});
