import { OpenRouter } from "@openrouter/sdk";
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ToolMessage,
} from "../types";
import { config } from "../config";

let openrouterInstance: OpenRouter | null = null;

const getOpenRouterClient = () => {
  if (!openrouterInstance) {
    openrouterInstance = new OpenRouter({
      apiKey: config.openrouter.apiKey,
    });
  }
  return openrouterInstance;
};

export const OpenRouterService = {
  name: "OpenRouter",
  defaultModel: "openai/gpt-3.5-turbo",
  async chat(
    messages: (ChatMessage | ToolMessage)[],
    options?: ChatOptions
  ): Promise<AsyncIterable<string> | ChatResponse> {
    const openrouter = getOpenRouterClient();
    const hasTools = options?.tools && options.tools.length > 0;

    const requestParams: any = {
      messages,
      model: options?.model || this.defaultModel,
      stop: options?.stop || null,
    };

    // Add tools if provided
    if (hasTools) {
      requestParams.tools = options.tools;
      requestParams.stream = false; // Disable streaming when using tools
    } else {
      requestParams.stream = true; // Enable streaming when not using tools
    }

    const chatCompletion = await openrouter.chat.send({
      chatRequest: requestParams as any,
    });

    if (hasTools) {
      // Return structured response with potential tool calls
      const message = (chatCompletion as any).choices[0].message;
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
