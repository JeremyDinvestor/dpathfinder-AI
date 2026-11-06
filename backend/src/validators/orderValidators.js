// Rules for order and report requests. The AI tools reuse these same rules.
import { z } from "zod";
import { ORDER_STATUSES } from "../models/Order.js";
import { objectId } from "./customerValidators.js";

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(ORDER_STATUSES).optional(),
  customerId: objectId.optional(),
  customerEmail: z.string().trim().toLowerCase().email().max(254).optional(),
});

export const orderIdParamsSchema = z.object({ id: objectId });

export const updateOrderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

export const reportSchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});
