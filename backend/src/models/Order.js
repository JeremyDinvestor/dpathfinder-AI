// An order placed by a customer. Always belongs to ONE workspace.
import mongoose from "mongoose";

export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

// Which status can follow which. An empty list means "final".
export const ALLOWED_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    orderNumber: { type: String, required: true, trim: true, uppercase: true },
    items: { type: [itemSchema], default: [] },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
  },
  { timestamps: true }
);

orderSchema.index({ workspace: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ workspace: 1, status: 1 });

export default mongoose.model("Order", orderSchema);
