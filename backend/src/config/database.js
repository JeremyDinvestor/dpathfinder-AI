// Connects to MongoDB using Mongoose.
import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env.js";

// Some networks refuse Node's DNS lookups for mongodb+srv:// strings.
// If DNS_SERVERS is set in .env, Node uses those DNS servers instead.
export function useCustomDns() {
  const servers = (process.env.DNS_SERVERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length > 0) dns.setServers(servers);
}

export async function connectDatabase(uri = env.mongodbUri) {
  useCustomDns();
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
