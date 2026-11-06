// One row per AI request, used for the usage summary.
import mongoose from "mongoose";

const usageRecordSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    apiKey: { type: mongoose.Schema.Types.ObjectId, ref: "ApiKey" },
    endpoint: { type: String, required: true },
    model: { type: String },
    promptTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    status: { type: String, enum: ["success", "error"], required: true },
  },
  { timestamps: true }
);

usageRecordSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model("UsageRecord", usageRecordSchema);
