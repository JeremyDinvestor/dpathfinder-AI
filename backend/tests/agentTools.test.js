// Gate C: the Gemini tool-calling round trip, with a FAKE Gemini (no real API calls).
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";

vi.mock("../src/services/geminiService.js", () => ({ generate: vi.fn() }));

import { generate } from "../src/services/geminiService.js";
import app from "../src/app.js";
import Customer from "../src/models/Customer.js";
import Order from "../src/models/Order.js";
import Conversation from "../src/models/Conversation.js";
import UsageRecord from "../src/models/UsageRecord.js";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db.js";
import { registerSeededUser, createKey, bearer } from "./helpers/factories.js";
import { toolCallResponse, textResponse } from "./helpers/gemini.js";

beforeAll(startTestDb);
afterAll(stopTestDb);

let user;
beforeEach(async () => {
  generate.mockReset();
  await clearDb();
  user = await registerSeededUser("agent@example.com");
});

const chat = (message, extra = {}) =>
  request(app).post("/api/v1/chat").set(bearer(user.token)).send({ message, ...extra });

describe("agent tool-calling round trip", () => {
  it("asks for pending orders: getOrders runs and its result goes back to Gemini", async () => {
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "getOrders", args: { status: "pending" } }))
      .mockResolvedValueOnce(textResponse("You have 2 pending orders."));

    const res = await chat("Show me all pending orders");
    expect(res.status).toBe(200);
    expect(res.body.data.reply).toBe("You have 2 pending orders.");
    expect(res.body.data.toolCalls).toEqual([{ name: "getOrders", ok: true }]);
    expect(generate).toHaveBeenCalledTimes(2);

    // The second call must contain the tool result as a functionResponse.
    const secondContents = generate.mock.calls[1][0].contents;
    const lastTurn = secondContents.at(-1);
    expect(lastTurn.role).toBe("user");
    const fr = lastTurn.parts[0].functionResponse;
    expect(fr.name).toBe("getOrders");
    expect(fr.response.output.orders).toHaveLength(2);
    expect(fr.response.output.orders.every((o) => o.status === "pending")).toBe(true);
  });

  it("sends tool declarations and a system instruction to Gemini", async () => {
    generate.mockResolvedValueOnce(textResponse("Hello!"));
    await chat("hi");
    const arg = generate.mock.calls[0][0];
    expect(arg.tools.map((t) => t.name).sort()).toEqual(
      ["createCustomer", "generateBusinessReport", "getCustomers", "getOrders", "updateOrderStatus"]
    );
    expect(arg.systemInstruction).toMatch(/never pretend/i);
  });

  it("createCustomer persists exactly one record", async () => {
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "createCustomer", args: { name: "Ngozi Eze", email: "NGOZI@example.com" } }))
      .mockResolvedValueOnce(textResponse("Created Ngozi Eze."));

    const res = await chat("Add customer Ngozi Eze, ngozi@example.com");
    expect(res.body.data.toolCalls).toEqual([{ name: "createCustomer", ok: true }]);
    expect(await Customer.countDocuments({ workspace: user.workspaceId, email: "ngozi@example.com" })).toBe(1);
    expect(await Customer.countDocuments({ workspace: user.workspaceId })).toBe(7);
  });

  it("blocks an identical write repeated in one turn (still exactly one record)", async () => {
    const call = { name: "createCustomer", args: { name: "Twice Tester", email: "twice@example.com" } };
    generate
      .mockResolvedValueOnce(toolCallResponse(call, call))
      .mockResolvedValueOnce(textResponse("Done."));

    const res = await chat("Add Twice Tester");
    expect(res.body.data.toolCalls.map((t) => t.ok)).toEqual([true, false]);
    expect(await Customer.countDocuments({ email: "twice@example.com" })).toBe(1);
  });

  it("generateBusinessReport values match the database", async () => {
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "generateBusinessReport", args: {} }))
      .mockResolvedValueOnce(textResponse("Revenue is 320000."));
    await chat("Give me a report");
    const output = generate.mock.calls[1][0].contents.at(-1).parts[0].functionResponse.response.output;
    expect(output.totalOrders).toBe(await Order.countDocuments({ workspace: user.workspaceId }));
    expect(output.revenue).toBe(320000);
    expect(output.pipelineValue).toBe(350500);
  });

  it("missing required fields: tool fails, nothing is created, error goes back to Gemini", async () => {
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "createCustomer", args: { name: "No Email" } }))
      .mockResolvedValueOnce(textResponse("I need an email address."));

    const res = await chat("Add customer No Email");
    expect(res.body.data.toolCalls[0]).toMatchObject({ name: "createCustomer", ok: false });
    expect(res.body.data.toolCalls[0].error).toMatch(/email/i);
    expect(await Customer.countDocuments({ name: "No Email" })).toBe(0);
    const fr = generate.mock.calls[1][0].contents.at(-1).parts[0].functionResponse;
    expect(fr.response.error).toMatch(/email/i);
    expect(fr.response.output).toBeUndefined();
  });

  it("unknown tool names are refused and change nothing", async () => {
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "deleteEverything", args: {} }))
      .mockResolvedValueOnce(textResponse("I can't do that."));
    const res = await chat("Delete all data");
    expect(res.body.data.toolCalls[0]).toMatchObject({ name: "deleteEverything", ok: false });
    expect(await Customer.countDocuments({ workspace: user.workspaceId })).toBe(6);
    expect(await Order.countDocuments({ workspace: user.workspaceId })).toBe(10);
  });

  it("ignores a workspaceId that Gemini (or a prompt injection) tries to pass", async () => {
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "getCustomers", args: { workspaceId: "aaaaaaaaaaaaaaaaaaaaaaaa" } }))
      .mockResolvedValueOnce(textResponse("ok"));
    await chat("list customers");
    const output = generate.mock.calls[1][0].contents.at(-1).parts[0].functionResponse.response.output;
    expect(output.customers).toHaveLength(6); // still this user's workspace
  });

  it("a failed tool is reported as failed - the order is unchanged", async () => {
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "updateOrderStatus", args: { orderNumber: "ORD-1007", status: "pending" } }))
      .mockResolvedValueOnce(textResponse("That change is not allowed."));
    const res = await chat("Set ORD-1007 back to pending");
    expect(res.body.data.toolCalls[0]).toMatchObject({ ok: false });
    expect(res.body.data.toolCalls[0].error).toMatch(/Cannot change order ORD-1007/);
    expect((await Order.findOne({ workspace: user.workspaceId, orderNumber: "ORD-1007" })).status).toBe("delivered");
  });

  it("updateOrderStatus by order number works for a valid move", async () => {
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "updateOrderStatus", args: { orderNumber: "ord-1001", status: "processing" } }))
      .mockResolvedValueOnce(textResponse("ORD-1001 is now processing."));
    const res = await chat("Start processing ORD-1001");
    expect(res.body.data.toolCalls).toEqual([{ name: "updateOrderStatus", ok: true }]);
    expect((await Order.findOne({ workspace: user.workspaceId, orderNumber: "ORD-1001" })).status).toBe("processing");
  });

  it("returns a safe 502 when Gemini fails, without leaking the error", async () => {
    generate.mockRejectedValue(new Error("boom: secret internal detail"));
    const res = await chat("hello");
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("ai_unavailable");
    expect(JSON.stringify(res.body)).not.toContain("boom");
    expect(await UsageRecord.countDocuments({ workspace: user.workspaceId, status: "error" })).toBe(1);
  });

  it("stops a model that keeps calling tools forever", async () => {
    generate.mockResolvedValue(toolCallResponse({ name: "getOrders", args: {} }));
    const res = await chat("loop");
    expect(res.status).toBe(200);
    expect(generate).toHaveBeenCalledTimes(5);
    expect(res.body.data.reply).toMatch(/could not finish/i);
  });

  it("saves the conversation, can continue it, and records usage", async () => {
    generate.mockResolvedValueOnce(textResponse("First answer."));
    const first = await chat("first question");
    const { conversationId } = first.body.data;

    generate.mockResolvedValueOnce(textResponse("Second answer."));
    await chat("second question", { conversationId });

    // The second Gemini call received the earlier messages as history.
    const history = generate.mock.calls[1][0].contents;
    expect(history.map((c) => c.role)).toEqual(["user", "model", "user"]);

    const saved = await Conversation.findById(conversationId);
    expect(saved.messages.map((m) => m.text)).toEqual(["first question", "First answer.", "second question", "Second answer."]);

    const usage = await UsageRecord.find({ workspace: user.workspaceId });
    expect(usage).toHaveLength(2);
    expect(usage[0].totalTokens).toBe(15);

    const summary = await request(app).get("/api/v1/usage").set(bearer(user.token));
    expect(summary.body.data.totals).toMatchObject({ requests: 2, successful: 2, totalTokens: 30 });
  });

  it("cannot continue someone else's conversation", async () => {
    generate.mockResolvedValueOnce(textResponse("hi"));
    const { conversationId } = (await chat("hello")).body.data;
    const other = await registerSeededUser("other@example.com");
    const res = await request(app).post("/api/v1/chat").set(bearer(other.token)).send({ message: "hi", conversationId });
    expect(res.status).toBe(404);
  });

  it("validates the chat message", async () => {
    expect((await chat("")).status).toBe(400);
    expect((await chat("x".repeat(1001))).status).toBe(400);
    expect(generate).not.toHaveBeenCalled();
  });

  it("an API key only lets the agent use tools its scopes allow", async () => {
    const created = await createKey(user.token, { scopes: ["chat", "customers:read"] });
    const key = created.body.data.key;
    generate
      .mockResolvedValueOnce(toolCallResponse({ name: "createCustomer", args: { name: "Blocked", email: "blocked@example.com" } }))
      .mockResolvedValueOnce(textResponse("Not allowed."));

    const res = await request(app).post("/api/v1/chat").set("x-api-key", key).send({ message: "add Blocked" });
    expect(res.status).toBe(200);
    expect(res.body.data.toolCalls[0]).toMatchObject({ name: "createCustomer", ok: false });
    expect(await Customer.countDocuments({ email: "blocked@example.com" })).toBe(0);

    // Gemini was only shown the read tool this key may use.
    expect(generate.mock.calls[0][0].tools.map((t) => t.name)).toEqual(["getCustomers"]);
  });
});
