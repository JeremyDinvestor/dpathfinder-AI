// Builders for fake Gemini responses, shaped like the real SDK response.
const usageMetadata = { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 };

export function toolCallResponse(...calls) {
  // calls: [{ name, args }, ...]
  return {
    text: undefined,
    functionCalls: calls,
    candidates: [{ content: { role: "model", parts: calls.map((c) => ({ functionCall: c })) } }],
    usageMetadata,
  };
}

export function textResponse(text) {
  return {
    text,
    functionCalls: undefined,
    candidates: [{ content: { role: "model", parts: [{ text }] } }],
    usageMetadata,
  };
}
