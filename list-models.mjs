// Asks Google which models this API key can use for chat/tool calling
console.log("Script started...");

const key = process.env.GEMINI_API_KEY;
console.log("Key found:", key ? "yes (length " + key.length + ")" : "NO");

if (!key) {
  console.log(
    "The key was not loaded. Check your .env file name and location.",
  );
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=100`;

try {
  const res = await fetch(url);
  const data = await res.json();
  console.log("HTTP status:", res.status);

  if (!res.ok) {
    console.log("Error from Google:", data.error?.message);
  } else {
    const names = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""));
    console.log("Models found:", names.length);
    console.log(names.join("\n"));
  }
} catch (err) {
  console.log("Request failed:", err.message);
}
