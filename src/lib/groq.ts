import { Groq } from "groq-sdk";
import { ChatMessage, ChatOptions } from "../types";
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

export const GroqService = {
  name: "Groq",
  defaultModel: "openai/gpt-oss-120b",
  async chat(messages: ChatMessage[], options?: ChatOptions) {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: options?.model || this.defaultModel,
      stream: true, // By default, we want streaming responses
      stop: options?.stop || null,
      temperature: options?.temperature ?? 0.7,
      max_completion_tokens: options?.max_completion_tokens ?? 2048,
    });

    return (async function* () {
      for await (const message of chatCompletion) {
        yield message.choices[0].delta.content || "";
      }
    })();
  },
};
