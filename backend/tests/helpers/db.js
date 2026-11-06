import { useCustomDns } from "../../src/config/database.js";
// Test database helpers. By default tests use a temporary in-memory MongoDB
// (downloaded automatically the first time). You can instead set TEST_MONGODB_URI
// to a database whose name contains "test".
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer;

export async function startTestDb() {
  useCustomDns();
  let uri = process.env.TEST_MONGODB_URI;
  if (uri) {
    if (!/\/[^/?]*test[^/?]*(\?|$)/i.test(uri)) {
      throw new Error(
        'TEST_MONGODB_URI must point to a database whose name contains "test".',
      );
    }
  } else {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri("dpathfinder_test");
  }
  await mongoose.connect(uri);
  // Build unique indexes before tests run (duplicate checks depend on them).
  await Promise.all(
    mongoose.modelNames().map((name) => mongoose.model(name).init()),
  );
}

export async function clearDb() {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})),
  );
}

export async function stopTestDb() {
  try {
    if (process.env.TEST_MONGODB_URI && mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
  } finally {
    await mongoose.disconnect();
    if (memoryServer) await memoryServer.stop();
  }
}
