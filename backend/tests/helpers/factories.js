// Shortcuts used by many tests.
import request from "supertest";
import app from "../../src/app.js";
import { seedWorkspace } from "../../src/services/demoService.js";

export async function registerUser(email = "user@example.com") {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: "Password123", displayName: "Test User" });
  return { token: res.body.data.token, workspaceId: res.body.data.workspace.id, userId: res.body.data.user.id };
}

// A user whose workspace already has the 6 sample customers and 10 sample orders.
export async function registerSeededUser(email) {
  const user = await registerUser(email);
  await seedWorkspace(user.workspaceId);
  return user;
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

export async function createKey(token, body = {}) {
  const res = await request(app)
    .post("/api/v1/api-keys")
    .set(bearer(token))
    .send({ label: "Test key", ...body });
  return res;
}
