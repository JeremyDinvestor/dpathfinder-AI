// The REAL business actions. Both the REST routes and the AI agent call these.
//
// Rules every function follows:
//  1. The first argument is `ctx` = { workspaceId }. It comes from the server
//     (login token / API key / demo), NEVER from the caller or from Gemini.
//  2. Every database query includes `workspace: ctx.workspaceId`.
//  3. Arguments are already validated before these functions run.
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Order, { ORDER_STATUSES, ALLOWED_TRANSITIONS } from "../models/Order.js";
import { AppError } from "../utils/responses.js";

// ---------- small helpers ----------
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function pagination(total, page, limit) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function toCustomer(c) {
  return { id: c._id.toString(), name: c.name, email: c.email, phone: c.phone ?? null, createdAt: c.createdAt };
}

function toOrder(o) {
  return {
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    status: o.status,
    amount: o.amount,
    currency: o.currency,
    items: o.items,
    customer: o.customer?._id
      ? { id: o.customer._id.toString(), name: o.customer.name, email: o.customer.email }
      : null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

// ---------- getCustomers ----------
export async function getCustomers(ctx, { search, page = 1, limit = 10 } = {}) {
  const filter = { workspace: ctx.workspaceId };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i"); // escaped, so users can't inject regex
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);
  return { customers: customers.map(toCustomer), pagination: pagination(total, page, limit) };
}

// ---------- createCustomer ----------
export async function createCustomer(ctx, { name, email, phone }) {
  try {
    const customer = await Customer.create({ workspace: ctx.workspaceId, name, email, phone });
    return { customer: toCustomer(customer.toObject()) };
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError(409, "A customer with this email already exists in this workspace.", "duplicate_email");
    }
    throw err;
  }
}

// ---------- getOrders ----------
export async function getOrders(ctx, { status, customerId, customerEmail, page = 1, limit = 10 } = {}) {
  const filter = { workspace: ctx.workspaceId };
  if (status) filter.status = status;
  if (customerId) filter.customer = customerId;

  if (customerEmail) {
    const customer = await Customer.findOne({ workspace: ctx.workspaceId, email: customerEmail }).lean();
    if (!customer) {
      return { orders: [], pagination: pagination(0, page, limit) };
    }
    filter.customer = customer._id;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("customer", "name email")
      .lean(),
    Order.countDocuments(filter),
  ]);
  return { orders: orders.map(toOrder), pagination: pagination(total, page, limit) };
}

// ---------- updateOrderStatus ----------
// Pass either orderId (REST route) or orderNumber (the AI agent usually knows this).
export async function updateOrderStatus(ctx, { orderId, orderNumber, status }) {
  const filter = { workspace: ctx.workspaceId };
  if (orderId) filter._id = orderId;
  else filter.orderNumber = orderNumber.trim().toUpperCase();

  const order = await Order.findOne(filter);
  if (!order) throw new AppError(404, "Order not found.", "order_not_found");

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    throw new AppError(
      409,
      `Cannot change order ${order.orderNumber} from "${order.status}" to "${status}". ` +
        `Allowed next statuses: ${allowed.length ? allowed.join(", ") : "none (this status is final)"}.`,
      "invalid_transition"
    );
  }

  // The "status: order.status" condition makes sure nobody changed the order
  // between our check above and this update.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, workspace: ctx.workspaceId, status: order.status },
    { status },
    { new: true }
  )
    .populate("customer", "name email")
    .lean();

  if (!updated) {
    throw new AppError(409, "The order was changed by someone else. Please try again.", "order_conflict");
  }
  return { order: toOrder(updated), previousStatus: order.status };
}

// ---------- generateBusinessReport ----------
// Definitions (also written in the README):
//   revenue       = total amount of DELIVERED orders
//   pipelineValue = total amount of pending + processing + shipped orders
//   cancelled orders are reported separately and never counted as revenue.
export async function generateBusinessReport(ctx, { fromDate, toDate } = {}) {
  const match = { workspace: new mongoose.Types.ObjectId(ctx.workspaceId) };
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = fromDate;
    // toDate includes the whole day (up to 23:59:59.999 UTC)
    if (toDate) match.createdAt.$lte = new Date(toDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  const [rows, customerCount] = await Promise.all([
    Order.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
    ]),
    Customer.countDocuments({ workspace: ctx.workspaceId }),
  ]);

  const byStatus = {};
  for (const status of ORDER_STATUSES) byStatus[status] = { count: 0, totalAmount: 0 };
  for (const row of rows) byStatus[row._id] = { count: row.count, totalAmount: round2(row.totalAmount) };

  const totalOrders = ORDER_STATUSES.reduce((sum, s) => sum + byStatus[s].count, 0);
  const revenue = byStatus.delivered.totalAmount;
  const pipelineValue = round2(
    byStatus.pending.totalAmount + byStatus.processing.totalAmount + byStatus.shipped.totalAmount
  );
  const activeCount = totalOrders - byStatus.cancelled.count;
  const activeValue = revenue + pipelineValue;

  return {
    currency: "NGN",
    period: { fromDate: fromDate ?? null, toDate: toDate ?? null },
    customerCount,
    totalOrders,
    byStatus,
    revenue,
    pipelineValue,
    cancelledValue: byStatus.cancelled.totalAmount,
    averageOrderValue: activeCount > 0 ? round2(activeValue / activeCount) : 0,
  };
}
