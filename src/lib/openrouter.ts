import { OpenRouter } from "@openrouter/sdk";
import { ChatMessage, ChatOptions } from "../types";
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
  async chat(messages: ChatMessage[], options?: ChatOptions) {
    const openrouter = getOpenRouterClient();
    const chatCompletion = await openrouter.chat.send({
      chatRequest: {
        messages,
        model: options?.model || this.defaultModel,
        stream: true, // By default, we want streaming responses
        stop: options?.stop || null,
      },
    });

    return (async function* () {
      for await (const message of chatCompletion) {
        yield message.choices[0].delta.content || "";
      }
    })();
  },
};
