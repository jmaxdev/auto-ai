import { Groq } from "groq-sdk";
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ToolCall,
  ToolMessage,
} from "../types";
import { config } from "../config";

let groqInstance: Groq | null = null;

const getGroqClient = () => {
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: config.groq.apiKey,
    });
  }
  return groqInstance;
};

const extractToolCalls = (content: any): ToolCall[] => {
  if (!content || !Array.isArray(content)) return [];
  return content
    .filter((c: any) => c.type === "tool_use")
    .map((c: any) => ({
      id: c.id || "",
      type: "function" as const,
      function: {
        name: c.name || "",
        arguments:
          typeof c.input === "string" ? c.input : JSON.stringify(c.input || {}),
      },
    }));
};

export const GroqService = {
  name: "Groq",
  defaultModel: "openai/gpt-oss-120b",
  async chat(
    messages: (ChatMessage | ToolMessage)[],
    options?: ChatOptions
  ): Promise<AsyncIterable<string> | ChatResponse> {
    const groq = getGroqClient();
    const hasTools = options?.tools && options.tools.length > 0;

    // Prepare messages for Groq API
    const groqMessages = messages as any[];

    const requestParams: any = {
      messages: groqMessages,
      model: options?.model || this.defaultModel,
      stop: options?.stop || null,
      temperature: options?.temperature ?? 0.7,
      max_completion_tokens: options?.max_completion_tokens ?? 2048,
    };

    // Add tools if provided
    if (hasTools) {
      requestParams.tools = options.tools;
      requestParams.stream = false; // Disable streaming when using tools
    } else {
      requestParams.stream = true; // Enable streaming when not using tools
    }

    const chatCompletion = await groq.chat.completions.create(requestParams);

    if (hasTools) {
      // Return structured response with potential tool calls
      const message = chatCompletion.choices[0].message;
      const toolCalls = message.tool_calls
        ? message.tool_calls.map((tc: any) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          }))
        : [];

      const response: ChatResponse = {
        content: message.content || "",
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        service: this.name,
        model: options?.model || this.defaultModel,
      };
      return response;
    }

    // Return streaming response when tools are not used
    return (async function* () {
      for await (const message of chatCompletion as any) {
        yield message.choices[0].delta.content || "";
      }
    })();
  },
};
