import { Cerebras } from "@cerebras/cerebras_cloud_sdk";
import type {
  ChatOptions,
  ChatResponse,
  ToolMessage,
  ChatMessage,
} from "../types";
import { config } from "../config";

let cerebrasInstance: Cerebras | null = null;

const getCerebrasClient = () => {
  if (!cerebrasInstance) {
    cerebrasInstance = new Cerebras({
      apiKey: config.cerebras.apiKey,
    });
  }
  return cerebrasInstance;
};

export const CerebrasService = {
  name: "Cerebras",
  defaultModel: "llama3.1-8b",
  async chat(
    messages: (ChatMessage | ToolMessage)[],
    options?: ChatOptions
  ): Promise<AsyncIterable<string> | ChatResponse> {
    const cerebras = getCerebrasClient();
    const hasTools = options?.tools && options.tools.length > 0;

    const requestParams: any = {
      messages: messages as any,
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

    const chatCompletion = await cerebras.chat.completions.create(
      requestParams
    );

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
        yield (message as any).choices[0].delta.content || "";
      }
    })();
  },
};
