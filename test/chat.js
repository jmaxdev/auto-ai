import { Chat } from "../dist-dev/index.js";

console.log("Testing chat with OpenRouter...");

const messages = [
  { role: "user", content: "Hello, how are you?" }
];

try {
  const response = await Chat(messages, {
    serviceExclusion: ["Google"] // Exclude Groq, Cerebras, use other providers...
  });

  console.log("Response:");
  console.log(response);
  console.log("\n");
} catch (error) {
  console.error("Error:", error.message);
}