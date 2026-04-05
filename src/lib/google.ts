import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage, ChatOptions } from "../types";
import { config } from "../config";

let googleInstance: GoogleGenerativeAI | null = null;

const getGoogleClient = () => {
  if (!googleInstance) {
    googleInstance = new GoogleGenerativeAI(config.google.apiKey as string);
  }
  return googleInstance;
};

export const GoogleService = {
  name: "Google",
  defaultModel: "gemini-2.0-flash",
  async chat(messages: ChatMessage[], options?: ChatOptions) {
    const google = getGoogleClient();
    const model = google.getGenerativeModel({
      model: options?.model || this.defaultModel,
    });

    const gemRes = await model.generateContent(messages as any);
    const response = await gemRes.response;
    const content = response.text();

    return (async function* () {
      yield content;
    })();
  },
};
