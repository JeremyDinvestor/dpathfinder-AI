// The public demo: one shared, isolated workspace filled with sample data.
// Real user workspaces are never touched by anything in this file.
import Workspace from "../models/Workspace.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import Conversation from "../models/Conversation.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/responses.js";

// Sample data is fixed on purpose, so report totals can be checked by hand:
//   10 orders | pending 2 = 117,500 | processing 2 = 148,000 | shipped 2 = 85,000
//   delivered 3 = 320,000 | cancelled 1 = 38,000
//   revenue = 320,000 | pipeline = 350,500
export const DEMO_CUSTOMERS = [
  { name: "Adaeze Okafor", email: "adaeze.okafor@example.com", phone: "+234 801 000 0001" },
  { name: "Tunde Bakare", email: "tunde.bakare@example.com", phone: "+234 801 000 0002" },
  { name: "Chioma Nwosu", email: "chioma.nwosu@example.com", phone: "+234 801 000 0003" },
  { name: "Ibrahim Musa", email: "ibrahim.musa@example.com", phone: "+234 801 000 0004" },
  { name: "Funke Adeyemi", email: "funke.adeyemi@example.com" },
  { name: "Emeka Obi", email: "emeka.obi@example.com" },
];

export const DEMO_ORDERS = [
  { orderNumber: "ORD-1001", email: "adaeze.okafor@example.com", item: "Office chair", amount: 45000, status: "pending" },
  { orderNumber: "ORD-1002", email: "tunde.bakare@example.com", item: "Standing desk", amount: 72500, status: "pending" },
  { orderNumber: "ORD-1003", email: "chioma.nwosu@example.com", item: "Laptop stand", amount: 18000, status: "processing" },
  { orderNumber: "ORD-1004", email: "ibrahim.musa@example.com", item: "Monitor", amount: 130000, status: "processing" },
  { orderNumber: "ORD-1005", email: "funke.adeyemi@example.com", item: "Keyboard", amount: 25000, status: "shipped" },
  { orderNumber: "ORD-1006", email: "emeka.obi@example.com", item: "Printer", amount: 60000, status: "shipped" },
  { orderNumber: "ORD-1007", email: "adaeze.okafor@example.com", item: "Desk lamp bundle", amount: 85000, status: "delivered" },
  { orderNumber: "ORD-1008", email: "tunde.bakare@example.com", item: "Webcam", amount: 15000, status: "delivered" },
  { orderNumber: "ORD-1009", email: "chioma.nwosu@example.com", item: "Conference speaker", amount: 220000, status: "delivered" },
  { orderNumber: "ORD-1010", email: "ibrahim.musa@example.com", item: "Headset", amount: 38000, status: "cancelled" },
];

// Fills ANY workspace with the sample data (used by the demo and by tests).
export async function seedWorkspace(workspaceId) {
  const customers = await Customer.insertMany(DEMO_CUSTOMERS.map((c) => ({ ...c, workspace: workspaceId })));
  const byEmail = new Map(customers.map((c) => [c.email, c]));

  const orders = await Order.insertMany(
    DEMO_ORDERS.map((o) => ({
      workspace: workspaceId,
      customer: byEmail.get(o.email)._id,
      orderNumber: o.orderNumber,
      items: [{ name: o.item, quantity: 1, unitPrice: o.amount }],
      amount: o.amount,
      currency: "NGN",
      status: o.status,
    }))
  );
  return { customers: customers.length, orders: orders.length };
}

// Finds (or creates) the one demo workspace.
export async function getDemoWorkspace() {
  const find = () =>
    Workspace.findOneAndUpdate(
      { isDemo: true },
      { $setOnInsert: { name: "DPathfinder Demo", tier: "free", status: "active", isDemo: true } },
      { upsert: true, new: true }
    );
  try {
    return await find();
  } catch (err) {
    if (err?.code === 11000) return Workspace.findOne({ isDemo: true }); // two requests created it at once
    throw err;
  }
}

let lastResetAt = 0;
let resetInProgress = null;

// Wipes ONLY the demo workspace's data and re-creates the sample data.
export async function resetDemoData({ force = false } = {}) {
  if (!force && Date.now() - lastResetAt < env.demoResetCooldownMs) {
    throw new AppError(429, "The demo was reset a moment ago. Please wait a few seconds.", "reset_cooldown");
  }
  if (resetInProgress) return resetInProgress; // two resets at once share one run

  resetInProgress = (async () => {
    const workspace = await getDemoWorkspace();
    await Promise.all([
      Customer.deleteMany({ workspace: workspace._id }),
      Order.deleteMany({ workspace: workspace._id }),
      Conversation.deleteMany({ workspace: workspace._id }),
    ]);
    const counts = await seedWorkspace(workspace._id);
    lastResetAt = Date.now();
    return counts;
  })().finally(() => {
    resetInProgress = null;
  });

  return resetInProgress;
}

// Makes sure the demo has data (first visit after a fresh database).
export async function ensureDemoData() {
  const workspace = await getDemoWorkspace();
  if ((await Customer.countDocuments({ workspace: workspace._id })) === 0) {
    await resetDemoData({ force: true });
  }
  return workspace;
}
