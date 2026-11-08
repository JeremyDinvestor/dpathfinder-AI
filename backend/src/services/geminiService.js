// The ONLY file that talks to Google Gemini. Everything else calls generate().
// (Tests replace this file with a fake, so no real API calls happen in tests.)
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

let client;
function getClient() {
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

// Sends the conversation + tool menu to Gemini and returns its raw response.
export async function generate({ contents, systemInstruction, tools }) {
  const request = getClient().models.generateContent({
    model: env.geminiModel,
    contents,
    config: {
      systemInstruction,
      tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
    },
  });
  request.catch(() => {}); // avoids an "unhandled rejection" if the timeout below wins first

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error("Gemini request timed out");
      error.code = "AI_TIMEOUT";
      reject(error);
    }, env.geminiTimeoutMs);
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
