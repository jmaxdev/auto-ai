export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ToolMessage {
  role: "tool";
  tool_call_id: string;
  content: string;
}

export interface ChatCerebrasMessage {
  role: ChatMessage["role"] | "tool";
  content: string;
}

export interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  service: string;
  model: string;
}

export interface ChatOptions {
  model?: string;
  service?: string; // Explicitly specify service (e.g., "Groq", "Cerebras", "OpenRouter")
  stop?: string[];
  temperature?: number;
  max_completion_tokens?: number;
  serviceExclusion?: string[];
  tools?: Tool[];
}

export interface Service {
  name: string;
  defaultModel: string;
  chat: (
    messages: (ChatMessage | ToolMessage)[],
    options?: ChatOptions
  ) => Promise<AsyncIterable<string> | ChatResponse>;
}
