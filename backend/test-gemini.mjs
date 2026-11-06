import "dotenv/config";

const model = "gemini-3.8-flash";
const start = Date.now();

try {
  console.log("Testing text generation...");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "Reply with only: Gemini is working." }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 30,
          temperature: 0,
        },
      }),
      signal: AbortSignal.timeout(30000),
    },
  );

  const data = await response.json();

  console.log("HTTP Status:", response.status);
  console.log("Time:", Date.now() - start, "ms");

  if (response.ok) {
    console.log(
      "Gemini Response:",
      data.candidates?.[0]?.content?.parts?.[0]?.text,
    );
  } else {
    console.log("Google API Error:", data.error?.message);
  }
} catch (error) {
  console.log("Error:", error.name, error.message);
  console.log("Time:", Date.now() - start, "ms");
}
