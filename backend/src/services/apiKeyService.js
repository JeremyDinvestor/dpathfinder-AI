// Creating, listing, revoking and checking developer API keys.
import ApiKey from "../models/ApiKey.js";
import Workspace from "../models/Workspace.js";
import { generateApiKey, hashApiKey } from "../utils/hash.js";
import { AppError } from "../utils/responses.js";

const MAX_ACTIVE_KEYS = 10;

function toMetadata(key) {
  let status = "active";
  if (key.revokedAt) status = "revoked";
  else if (key.expiresAt && key.expiresAt <= new Date()) status = "expired";
  return {
    id: key._id.toString(),
    label: key.label,
    prefix: key.prefix,
    scopes: key.scopes,
    status,
    lastUsedAt: key.lastUsedAt ?? null,
    expiresAt: key.expiresAt ?? null,
    revokedAt: key.revokedAt ?? null,
    createdAt: key.createdAt,
  };
}

export async function createApiKey({ workspaceId, userId, label, scopes, expiresInDays }) {
  const activeCount = await ApiKey.countDocuments({ workspace: workspaceId, revokedAt: null });
  if (activeCount >= MAX_ACTIVE_KEYS) {
    throw new AppError(409, `You can have at most ${MAX_ACTIVE_KEYS} active API keys. Revoke one first.`, "too_many_keys");
  }

  const { rawKey, prefix, keyHash } = generateApiKey();
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined;

  const key = await ApiKey.create({
    workspace: workspaceId,
    createdBy: userId,
    label,
    prefix,
    keyHash,
    scopes,
    expiresAt,
  });

  // This is the ONLY time the raw key is ever returned.
  return { ...toMetadata(key), key: rawKey };
}

export async function listApiKeys(workspaceId) {
  const keys = await ApiKey.find({ workspace: workspaceId }).sort({ createdAt: -1 });
  return keys.map(toMetadata);
}

export async function revokeApiKey(workspaceId, keyId) {
  const key = await ApiKey.findOneAndUpdate(
    { _id: keyId, workspace: workspaceId, revokedAt: null },
    { revokedAt: new Date() },
    { new: true }
  );
  if (!key) throw new AppError(404, "API key not found (or already revoked).", "key_not_found");
  return toMetadata(key);
}

// Returns { apiKey, workspace } for a good key, or null for anything wrong
// (unknown, revoked, expired...). The caller gives one generic error for all cases.
export async function verifyApiKey(rawKey) {
  if (typeof rawKey !== "string" || !rawKey.startsWith("dpf_") || rawKey.length > 200) return null;

  const apiKey = await ApiKey.findOne({ keyHash: hashApiKey(rawKey) });
  if (!apiKey || apiKey.revokedAt) return null;
  if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) return null;

  const workspace = await Workspace.findById(apiKey.workspace);
  if (!workspace || workspace.status !== "active" || workspace.isDemo) return null;

  ApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() }).catch(() => {});
  return { apiKey, workspace };
}
