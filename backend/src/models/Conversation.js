// A saved chat with the agent (just the user/assistant text, not raw tool data).
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "model"], required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // empty for API keys / demo
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

conversationSchema.index({ workspace: 1, updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
