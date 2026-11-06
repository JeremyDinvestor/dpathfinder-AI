// A customer of the business. Always belongs to ONE workspace.
import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 30 },
  },
  { timestamps: true }
);

// The same email may exist in different workspaces, but only once per workspace.
customerSchema.index({ workspace: 1, email: 1 }, { unique: true });

export default mongoose.model("Customer", customerSchema);
