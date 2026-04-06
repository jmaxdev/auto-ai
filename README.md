# Auto AI

A lightweight Node.js library for routing chat requests across Groq, Cerebras, and OpenRouter.
Auto AI automatically selects the best provider for a given model name and returns a plain text response.

## Features

- Smart service selection using explicit service, prefix syntax, or model inference
- Supports Groq, Cerebras, OpenRouter, and Google providers
- Single `Chat()` entrypoint with a direct `string` response
- Lazy client initialization using environment variables
- Default provider fallback and rotation when the model is not recognized

## Install

```bash
npm install @trixty/auto-ai
# or
pnpm add @trixty/auto-ai
# or
yarn add @trixty/auto-ai
```

## Environment Setup

create a `.env` file in the root of your project and add your API keys for Groq, Cerebras, OpenRouter, and Google.

```env
GROQ_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
CEREBRAS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
```
### Importing

```typescript
import { Chat } from "@trixty/auto-ai";
```

### Explicit provider

```typescript
const response = await Chat(
  [{ role: "user", content: "Summarize this text." }],
  { model: "llama3-70b-8192", service: "Groq" }
);
console.log(response);
```

### Prefix syntax

```typescript
const response = await Chat([{ role: "user", content: "Write a haiku." }], {
  model: "openrouter:openai/gpt-4",
});
console.log(response);
```

### Automatic inference

```typescript
const response = await Chat(
  [{ role: "user", content: "Translate this sentence." }],
  { model: "anthropic/claude-3.5-sonnet" }
);
console.log(response);
```

### Exclude Service

```typescript
const response = await Chat(messages, {
    serviceExclusion: ["Google"] // Exclude Google.
  });
```

### Plain Text Response

```typescript
const response = await Chat(messages, {}, true);
console.log(response)
```


## How Service Selection Works

Auto AI resolves the provider in this order:

1. Explicit `service` option
2. `model` prefix syntax: `"service:model-name"`
3. Pattern inference from the model string
4. Round-robin fallback when no match is found

### Supported provider inference

- `Groq`: model names containing `mixtral`, `gemma`, or provider-specific paths starting with `groq/`
- `Cerebras`: model names containing `cerebras` or provider-specific paths starting with `cerebras/`
- `Google`: model names containing `gemini` or provider-specific paths starting with `google/`
- `OpenRouter`: slash-style model names from many providers, including `openai/gpt-4`, `anthropic/claude-3.5-sonnet`, `meta-llama/llama-4`, `qwen/qwen3-32b`, `z.ai/glm-4.7`, and many others.

> Note: OpenRouter supports a broad catalog and often accepts models from providers not listed here. When a model name is ambiguous across providers, use `service` or `Service:model` to select the exact provider.

### Recommended Google usage

If you want to target Google explicitly, use:

```typescript
const response = await Chat(
  [{ role: "user", content: "Write a short summary." }],
  { model: "google:gemini-2.0" }
);
console.log(response);
```

### Recommended Cerebras usage

If you want to target Cerebras explicitly, use:

```typescript
const response = await Chat(
  [{ role: "user", content: "Write a short summary." }],
  { model: "cerebras:llama3.1-8b" }
);
console.log(response);
```

## Chat Options

```typescript
interface ChatOptions {
  model?: string;
  service?: string; // "Groq", "Cerebras", "OpenRouter", or "Google"
  stop?: string[];
  temperature?: number;
  max_completion_tokens?: number;
  tools?: Tool[];
  serviceExclusion?: string[];
}
```

- `model` – Optional model name or prefix syntax (`Service:model`).
- `service` – Explicit provider when you want to override inference.
- `stop` – Optional stop sequences.
- `temperature` – Controls randomness.
- `max_completion_tokens` – Maximum generation length.
- `tools` – Optional array of tool definitions for function calling.
- `serviceExclusion` – Exclude specific services from fallback.

## Tool Calling / Function Calling

Auto AI supports tool/function calling across all providers. When you define tools, the model can ask to use them.

### Basic Tool Calling

```typescript
import { Chat } from "@trixty/auto-ai";

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
            description: "City and state, e.g. San Francisco, CA",
          },
        },
        required: ["location"],
      },
    },
  },
];

const messages = [
  { role: "user", content: "What's the weather in New York?" }
];

const response = await Chat(messages, {
  model: "Groq:llama-3.3-70b-versatile",
  tools: tools,
});

// Parse the response
const parsed = JSON.parse(response);
console.log("Content:", parsed.content);
console.log("Tool Calls:", parsed.toolCalls);
```

### Handling Tool Calls

When tools are provided:
- Streaming is **automatically disabled**
- The response includes a `toolCalls` array if the model requests to use tools
- Each tool call contains: `id`, `function.name`, and `function.arguments` (as JSON string)

**Response format with tools:**
```typescript
interface ChatResponse {
  content: string;           // Model's text response
  toolCalls?: ToolCall[];    // Array of tool calls if the model made any
  service: string;           // Provider name
  model: string;             // Model used
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;  // JSON stringified arguments
  };
}
```

### Continuing Conversations with Tool Results

After executing tools, you can continue the conversation:

```typescript
const toolResults = [
  { role: "user", content: "What's the weather in New York?" },
  {
    role: "assistant",
    content: "I'll check the weather for you.",
  },
  {
    role: "tool",
    tool_call_id: "call_1",
    content: JSON.stringify({ location: "New York", temperature: 72, condition: "Sunny" }),
  },
];

const finalResponse = await Chat(toolResults, {
  model: "Groq:llama-3.3-70b-versatile",
}, true); // true for plain text

console.log(finalResponse);
```

### Example: Complete Tool Loop

See [`test/tools.js`](test/tools.js) for a complete working example.

## Provider Defaults

- Groq default model: `openai/gpt-oss-120b`
- Cerebras default model: `llama3.1-8b`
- OpenRouter default model: `openai/gpt-3.5-turbo`
- Google default model: `gemini-2.0-flash`
