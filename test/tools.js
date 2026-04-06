import { Chat } from "../dist-dev/index.js";

console.log("=== Testing Tool Calling Features ===\n");

// Define example tools
const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "Temperature unit",
          },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Perform a mathematical calculation",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide"],
            description: "The operation to perform",
          },
          a: {
            type: "number",
            description: "First number",
          },
          b: {
            type: "number",
            description: "Second number",
          },
        },
        required: ["operation", "a", "b"],
      },
    },
  },
];

const messages = [
  { role: "user", content: "What's the weather like in New York and what is 5 + 3?" }
];

console.log("📤 Sending request with tools...\n");
console.log("Tools defined:", tools.map(t => t.function.name).join(", "));
console.log("Message:", messages[0].content);
console.log("\n");

try {
  const response = await Chat(messages, {
    service: "Groq", // You can use any service: "Groq", "Cerebras", "OpenRouter", or "Google"
    model: "llama-3.3-70b-versatile",
    tools: tools,
    temperature: 0.7,
    max_completion_tokens: 1024,
  }, false); // false = return JSON response

  console.log("✅ Response received:\n");

  try {
    const parsed = JSON.parse(response);
    console.log("Service:", parsed.service);
    console.log("Model:", parsed.model);
    console.log("\nContent:", parsed.content);

    if (parsed.toolCalls && parsed.toolCalls.length > 0) {
      console.log("\n🔧 Tool Calls Detected:");
      parsed.toolCalls.forEach((call, idx) => {
        console.log(`\n  Call ${idx + 1}:`);
        console.log(`    - ID: ${call.id}`);
        console.log(`    - Function: ${call.function.name}`);
        console.log(`    - Arguments:`, JSON.parse(call.function.arguments));
      });

      console.log("\n💡 Next Steps:");
      console.log("1. Parse the toolCalls from the response");
      console.log("2. Execute the tools using their names and arguments");
      console.log("3. Add results as tool messages to continue the conversation");
      console.log("4. Make another Chat call with the tool messages");
    } else {
      console.log("\n(No tool calls requested by the model)");
    }
  } catch (e) {
    console.log(response);
  }

} catch (error) {
  console.error("❌ Error:", error.message);
}

console.log("\n\n=== Example: Continuing conversation with tool results ===\n");

// Example of how to continue after tool calls
const toolResultMessages = [
  { role: "user", content: "What's the weather like in New York and what is 5 + 3?" },
  {
    role: "assistant",
    content: "I'll get the weather for New York and calculate 5 + 3 for you.",
    // In a real scenario, this would include tool_use markers depending on the service
  },
  {
    role: "tool",
    tool_call_id: "call_1",
    content: JSON.stringify({
      location: "New York, NY",
      temperature: 72,
      conditions: "Sunny",
    }),
  },
  {
    role: "tool",
    tool_call_id: "call_2",
    content: JSON.stringify({ result: 8 }),
  },
];

console.log("📤 Continuing conversation with tool results...\n");

try {
  const finalResponse = await Chat(toolResultMessages, {
    service: "Groq",
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
  }, true); // true = return plain text

  console.log("✅ Final Response:\n");
  console.log(finalResponse);
} catch (error) {
  console.error("❌ Error:", error.message);
}
