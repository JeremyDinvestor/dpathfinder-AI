// Gate A: missing configuration must fail clearly and safely.
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/server.js");

function runServer(extraEnv) {
  // Start from the current environment but REMOVE the app's variables, so the
  // test controls exactly what is set. cwd is a temp folder so a real .env file
  // in the project can't leak into this test.
  const env = { ...process.env };
  for (const name of ["MONGODB_URI", "GEMINI_API_KEY", "JWT_SECRET", "API_KEY_SECRET"]) delete env[name];
  return spawnSync(process.execPath, [serverFile], {
    cwd: os.tmpdir(),
    env: { ...env, ...extraEnv },
    encoding: "utf8",
    timeout: 20000,
  });
}

describe("startup configuration checks", () => {
  it("exits with a clear message when variables are missing", () => {
    const result = runServer({ NODE_ENV: "development" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("GEMINI_API_KEY");
    expect(result.stderr).toContain("MONGODB_URI");
  });

  it("refuses placeholder values and never prints secret values", () => {
    const result = runServer({
      MONGODB_URI: "replace_me_mongodb",
      GEMINI_API_KEY: "SUPER-SECRET-VALUE-123",
      JWT_SECRET: "a".repeat(40),
      API_KEY_SECRET: "b".repeat(40),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("placeholder");
    expect(result.stderr).not.toContain("SUPER-SECRET-VALUE-123");
  });

  it("refuses secrets that are too short", () => {
    const result = runServer({
      MONGODB_URI: "mongodb://127.0.0.1/x",
      GEMINI_API_KEY: "k",
      JWT_SECRET: "short",
      API_KEY_SECRET: "b".repeat(40),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("JWT_SECRET");
  });
});
