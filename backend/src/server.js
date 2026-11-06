// Starts the server: connect to MongoDB first, then listen for requests.
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

async function start() {
  try {
    await connectDatabase();
    console.log("MongoDB connected.");
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    console.error("Check MONGODB_URI in your .env file, your database password, and Atlas Network Access.");
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`DPathfinder API running on port ${env.port} (${env.nodeEnv}).`);
  });
  server.requestTimeout = 60000; // drop requests that take longer than 60 seconds

  const shutdown = async () => {
    console.log("Shutting down...");
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start();
