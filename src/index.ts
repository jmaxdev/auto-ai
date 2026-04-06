import type {
  ChatMessage,
  ChatOptions,
  Service,
  ChatResponse,
  ToolMessage,
} from "./types";
import { GroqService } from "./lib/groq";
import { CerebrasService } from "./lib/cerebras";
import { OpenRouterService } from "./lib/openrouter";
import { GoogleService } from "./lib/google";
import { getServiceForModel } from "./utils";
import { validateConfig } from "./config";

const services: Service[] = [
  GroqService,
  CerebrasService,
  OpenRouterService,
  GoogleService,
];

const Chat = async (
  messages: (ChatMessage | ToolMessage)[],
  options?: ChatOptions,
  plainText: boolean = false
) => {
  const service = getServiceForModel(services, options);

  // Clean model if it has prefix syntax "service:model"
  let cleanOptions = options || {};
  let model: string;
  if (cleanOptions.model?.includes(":")) {
    const [, currentModel] = cleanOptions.model.split(":", 2);
    cleanOptions = { ...cleanOptions, model: currentModel };
    model = currentModel;
  } else {
    model = cleanOptions.model || service.defaultModel;
  }

  const response = await service.chat(messages, cleanOptions);

  // Check if response is a ChatResponse object (when tools are used) or AsyncIterable (streaming)
  if (Symbol.asyncIterator in Object(response)) {
    // Streaming response
    let result = "";
    for await (const chunk of response as AsyncIterable<string>) {
      result += chunk;
    }

    if (plainText) {
      return result;
    }

    return JSON.stringify({
      service: service.name,
      model: model,
      result: result,
    });
  } else {
    // Tool calls response
    const chatResponse = response as ChatResponse;

    if (plainText) {
      return {
        content: chatResponse.content,
        toolCalls: chatResponse.toolCalls,
      };
    }

    return JSON.stringify({
      service: chatResponse.service,
      model: chatResponse.model,
      content: chatResponse.content,
      toolCalls: chatResponse.toolCalls,
    });
  }
};

export { Chat };
export type {
  ChatMessage,
  ChatOptions,
  Service,
  ChatResponse,
  ToolMessage,
  Tool,
  ToolCall,
} from "./types";
