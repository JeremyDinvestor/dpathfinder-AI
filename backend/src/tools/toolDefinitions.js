// The tool "menu" we show to Gemini. Gemini only reads these descriptions;
// it can ask for a tool, but OUR code decides whether and how it runs.
import { Type } from "@google/genai";
import { ORDER_STATUSES } from "../models/Order.js";

export const toolDeclarations = [
  {
    name: "getCustomers",
    description: "List or search customers. Returns customers with pagination.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search: { type: Type.STRING, description: "Optional text to match in customer name or email." },
        page: { type: Type.INTEGER, description: "Page number, starting at 1." },
        limit: { type: Type.INTEGER, description: "Customers per page (1-50, default 10)." },
      },
    },
  },
  {
    name: "createCustomer",
    description: "Create a new customer. Both name and email are required; ask the user if either is missing.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Customer full name." },
        email: { type: Type.STRING, description: "Customer email address." },
        phone: { type: Type.STRING, description: "Optional phone number." },
      },
      required: ["name", "email"],
    },
  },
  {
    name: "getOrders",
    description: "List or search orders, optionally filtered by status or by customer. Returns orders with pagination.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ORDER_STATUSES, description: "Only orders with this status." },
        customerEmail: { type: Type.STRING, description: "Only orders for the customer with this email." },
        customerId: { type: Type.STRING, description: "Only orders for this customer ID (from getCustomers)." },
        page: { type: Type.INTEGER, description: "Page number, starting at 1." },
        limit: { type: Type.INTEGER, description: "Orders per page (1-50, default 10)." },
      },
    },
  },
  {
    name: "updateOrderStatus",
    description:
      "Change an order's status. Only valid moves are allowed: pending -> processing or cancelled; " +
      "processing -> shipped or cancelled; shipped -> delivered.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderNumber: { type: Type.STRING, description: "Order number, for example ORD-1001." },
        status: { type: Type.STRING, enum: ORDER_STATUSES, description: "The new status." },
      },
      required: ["orderNumber", "status"],
    },
  },
  {
    name: "generateBusinessReport",
    description:
      "Calculate a business summary: order counts, status breakdown, revenue (delivered orders) and pipeline value.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fromDate: { type: Type.STRING, description: "Optional start date, YYYY-MM-DD." },
        toDate: { type: Type.STRING, description: "Optional end date, YYYY-MM-DD (inclusive)." },
      },
    },
  },
];
