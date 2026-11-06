// Register and login.
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import { env } from "../config/env.js";
import { hashPassword, verifyPassword, fakePasswordCheck } from "../utils/hash.js";
import { AppError, asyncHandler, sendSuccess } from "../utils/responses.js";

function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { algorithm: "HS256", expiresIn: env.jwtExpiresIn });
}

const publicUser = (user) => ({ id: user._id.toString(), email: user.email, displayName: user.displayName });
const publicWorkspace = (ws) => ({ id: ws._id.toString(), name: ws.name, tier: ws.tier });

export const register = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.validated.body;

  if (await User.findOne({ email })) {
    throw new AppError(409, "An account with this email already exists.", "email_taken");
  }

  let user;
  try {
    user = await User.create({ email, passwordHash: await hashPassword(password), displayName });
  } catch (err) {
    if (err?.code === 11000) throw new AppError(409, "An account with this email already exists.", "email_taken");
    throw err;
  }

  let workspace;
  try {
    workspace = await Workspace.create({ owner: user._id, name: `${displayName}'s Workspace` });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // don't leave a user without a workspace
    throw err;
  }

  sendSuccess(res, { token: signToken(user.id), user: publicUser(user), workspace: publicWorkspace(workspace) }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    await fakePasswordCheck(password);
    throw new AppError(401, "Invalid email or password.", "invalid_credentials");
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk || user.status !== "active") {
    throw new AppError(401, "Invalid email or password.", "invalid_credentials");
  }

  const workspace = await Workspace.findOne({ owner: user._id, isDemo: false });
  sendSuccess(res, { token: signToken(user.id), user: publicUser(user), workspace: workspace ? publicWorkspace(workspace) : null });
});
