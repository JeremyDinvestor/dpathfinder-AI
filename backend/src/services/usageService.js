// Records and summarises AI usage per workspace.
import mongoose from "mongoose";
import UsageRecord from "../models/UsageRecord.js";
import { env } from "../config/env.js";

// Never throws: failing to record usage must not break a chat answer.
export async function recordUsage({ workspaceId, apiKeyId, endpoint, usage, status }) {
  try {
    await UsageRecord.create({
      workspace: workspaceId,
      apiKey: apiKeyId || undefined,
      endpoint,
      model: env.geminiModel,
      promptTokens: usage?.promptTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      totalTokens: usage?.totalTokens ?? 0,
      status,
    });
  } catch (err) {
    console.error("Could not record usage:", err.message);
  }
}

export async function getUsageSummary(workspaceId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await UsageRecord.aggregate([
    { $match: { workspace: new mongoose.Types.ObjectId(workspaceId), createdAt: { $gte: since } } },
    {
      $group: {
        _id: { endpoint: "$endpoint", status: "$status" },
        requests: { $sum: 1 },
        promptTokens: { $sum: "$promptTokens" },
        outputTokens: { $sum: "$outputTokens" },
        totalTokens: { $sum: "$totalTokens" },
      },
    },
  ]);

  const totals = { requests: 0, successful: 0, failed: 0, promptTokens: 0, outputTokens: 0, totalTokens: 0 };
  const byEndpoint = {};
  for (const row of rows) {
    totals.requests += row.requests;
    if (row._id.status === "success") totals.successful += row.requests;
    else totals.failed += row.requests;
    totals.promptTokens += row.promptTokens;
    totals.outputTokens += row.outputTokens;
    totals.totalTokens += row.totalTokens;
    byEndpoint[row._id.endpoint] = (byEndpoint[row._id.endpoint] ?? 0) + row.requests;
  }
  return { periodDays: days, since, totals, byEndpoint };
}
