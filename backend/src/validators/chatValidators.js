// Rules for chat requests.
import { z } from "zod";
import { objectId } from "./customerValidators.js";

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required.").max(1000, "Message is too long (max 1000 characters)."),
  conversationId: objectId.optional(), // send it back to continue an earlier chat
});
