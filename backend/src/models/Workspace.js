// A workspace owns all business data (customers, orders...).
// Every user gets one. There is also exactly ONE special demo workspace
// (isDemo: true) that the public playground uses.
import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // empty for the demo workspace
    name: { type: String, required: true, trim: true, maxlength: 120 },
    tier: { type: String, enum: ["free", "pro"], default: "free" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Guarantees there can never be two demo workspaces.
workspaceSchema.index({ isDemo: 1 }, { unique: true, partialFilterExpression: { isDemo: true } });

export default mongoose.model("Workspace", workspaceSchema);
