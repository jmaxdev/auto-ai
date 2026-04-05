export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCerebrasMessage {
  role: ChatMessage["role"] | "tool";
  content: string;
}

export interface ChatOptions {
  model?: string;
  service?: string; // Explicitly specify service (e.g., "Groq", "Cerebras", "OpenRouter")
  stop?: string[];
  temperature?: number;
  max_completion_tokens?: number;
  serviceExclusion?: string[];
}

export interface Service {
  name: string;
  defaultModel: string;
  chat: (
    messages: ChatMessage[],
    options?: ChatOptions
  ) => Promise<AsyncIterable<string>>;
}
