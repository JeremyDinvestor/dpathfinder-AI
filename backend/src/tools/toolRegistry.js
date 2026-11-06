// The allowlist of tools the agent may run. Anything not listed here is refused.
// Each entry has: the validation rules, the scope needed, and the function to run.
import { z } from "zod";
import { AppError } from "../utils/responses.js";
import { ORDER_STATUSES } from "../models/Order.js";
import { createCustomerSchema, listCustomersSchema } from "../validators/customerValidators.js";
import { listOrdersSchema, reportSchema } from "../validators/orderValidators.js";
import { toolDeclarations } from "./toolDefinitions.js";
import {
  getCustomers,
  createCustomer,
  getOrders,
  updateOrderStatus,
  generateBusinessReport,
} from "./businessTools.js";

// Gemini identifies orders by number, so this schema differs slightly from the REST route.
const toolUpdateStatusSchema = z.object({
  orderNumber: z.string().trim().min(1).max(40),
  status: z.enum(ORDER_STATUSES),
});

const tools = {
  getCustomers: { scope: "customers:read", schema: listCustomersSchema, run: getCustomers },
  createCustomer: { scope: "customers:write", schema: createCustomerSchema, run: createCustomer },
  getOrders: { scope: "orders:read", schema: listOrdersSchema, run: getOrders },
  updateOrderStatus: { scope: "orders:write", schema: toolUpdateStatusSchema, run: updateOrderStatus },
  generateBusinessReport: { scope: "reports:read", schema: reportSchema, run: generateBusinessReport },
};

// Tools that change data. The agent will not run an identical write twice in one turn.
export const WRITE_TOOLS = new Set(["createCustomer", "updateOrderStatus"]);

// Gemini sometimes sends null or "" for fields it wants to skip. Treat those as "not provided".
function cleanArgs(args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) return {};
  return Object.fromEntries(Object.entries(args).filter(([, v]) => v !== null && v !== ""));
}

// Only show Gemini the tools this caller is allowed to use.
export function getToolDeclarations(scopes) {
  return toolDeclarations.filter((d) => scopes.includes(tools[d.name].scope));
}

// Validates and runs one tool call. Throws AppError if anything is wrong.
export async function executeTool(name, rawArgs, ctx) {
  if (typeof name !== "string" || !Object.hasOwn(tools, name)) {
    throw new AppError(400, `Unknown tool "${String(name).slice(0, 60)}".`, "unknown_tool");
  }
  const tool = tools[name];

  if (!ctx.scopes.includes(tool.scope)) {
    throw new AppError(403, `Not allowed: this caller does not have the "${tool.scope}" permission.`, "insufficient_scope");
  }

  const parsed = tool.schema.safeParse(cleanArgs(rawArgs));
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".") || "arguments"}: ${i.message}`).join("; ");
    throw new AppError(400, `Invalid arguments for ${name} - ${problems}`, "invalid_arguments");
  }

  // ctx (workspace) is trusted server data; parsed.data is the validated model input.
  return tool.run({ workspaceId: ctx.workspaceId }, parsed.data);
}
