import type { ChatMessage, ChatOptions, Service } from "./types";
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
  messages: ChatMessage[],
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
  let result = "";

  for await (const chunk of response) {
    result += chunk;
  }

  if (plainText) {
    return result; // the plain text.
  }

  // object with the service name and the full result text.
  return JSON.stringify({
    service: service.name,
    model: model,
    result: result,
  });
};

export { Chat };
