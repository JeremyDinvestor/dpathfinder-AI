// A developer API key. The raw key is NEVER stored, only its hash.
import mongoose from "mongoose";

// What a key is allowed to do (least privilege).
export const API_SCOPES = [
  "chat",
  "customers:read",
  "customers:write",
  "orders:read",
  "orders:write",
  "reports:read",
];

const apiKeySchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    prefix: { type: String, required: true }, // e.g. "dpf_AbCd1234" (safe to display)
    keyHash: { type: String, required: true, unique: true, select: false },
    scopes: { type: [{ type: String, enum: API_SCOPES }], default: [] },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

apiKeySchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model("ApiKey", apiKeySchema);
