import { Chat, validateConfig } from "../dist-dev/index.js";

// Validate configuration
const config = validateConfig();
if (!config.isValid) {
  console.warn("⚠️ Configuration incomplete. Missing variables:", config.missingKeys);
}

console.log("=== Service Selection and Model Tests ===\n");

const messages = [
  { role: "user", content: "Respond with one word: What is your name?" }
];

console.log("1️⃣ Model in documented list (OpenRouter):");
console.log("   model: 'openai/gpt-3.5-turbo'");
try {
  const result1 = await Chat(messages, {
    model: "openai/gpt-3.5-turbo",
    max_completion_tokens: 100
  });
  console.log("   ✓ Result:", result1.trim());
} catch (error) {
  console.error("   ✗ Error:", error.message);
}

console.log("\n2️⃣ Prefix syntax (Groq:new-model):");
console.log("   model: 'Groq:llama3-8b-8192'");
try {
  const result2 = await Chat(messages, {
    model: "Groq:llama3-8b-8192",
    max_completion_tokens: 100
  });
  console.log("   ✓ Result:", result2.trim());
} catch (error) {
  console.error("   ✗ Error:", error.message);
}

console.log("\n3️⃣ Explicitly specify service:");
console.log("   model: 'llama3-70b-8192', service: 'Groq'");
try {
  const result3 = await Chat(messages, {
    model: "llama3-70b-8192",
    service: "Groq",
    max_completion_tokens: 100
  });
  console.log("   ✓ Result:", result3.trim());
} catch (error) {
  console.error("   ✗ Error:", error.message);
}

console.log("\n4️⃣ Automatic inference (by pattern name):");
console.log("   model: 'llama3-new-model'");
try {
  const result4 = await Chat(messages, {
    model: "llama3-nuevo-modelo-customizado",
    max_completion_tokens: 100
  });
  console.log("   ✓ Result:", result4.trim());
} catch (error) {
  console.error("   ✗ Error:", error.message);
}

console.log("\n✅ All tests completed");
