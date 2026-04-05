import { Cerebras } from "@cerebras/cerebras_cloud_sdk";
import { ChatCerebrasMessage, ChatOptions } from "../types";
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
  async chat(messages: ChatCerebrasMessage[], options?: ChatOptions) {
    const cerebras = getCerebrasClient();
    const chatCompletion = await cerebras.chat.completions.create({
      messages: messages as any,
      model: options?.model || this.defaultModel,
      stream: true, // By default, we want streaming responses
      stop: options?.stop || null,
      temperature: options?.temperature ?? 0.7,
      max_completion_tokens: options?.max_completion_tokens ?? 2048,
    });

    return (async function* () {
      for await (const message of chatCompletion) {
        yield (message as any).choices[0].delta.content || "";
      }
    })();
  },
};
