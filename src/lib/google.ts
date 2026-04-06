import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ToolMessage,
} from "../types";
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
  async chat(
    messages: (ChatMessage | ToolMessage)[],
    options?: ChatOptions
  ): Promise<AsyncIterable<string> | ChatResponse> {
    const google = getGoogleClient();
    const model = google.getGenerativeModel({
      model: options?.model || this.defaultModel,
      tools: options?.tools
        ? [
            {
              functionDeclarations: options.tools.map((tool) => ({
                name: tool.function.name,
                description: tool.function.description,
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: tool.function.parameters.properties,
                  required: tool.function.parameters.required,
                },
              })),
            },
          ]
        : undefined,
    });

    const hasTools = options?.tools && options.tools.length > 0;

    if (hasTools) {
      // Non-streaming for tool calls
      const gemRes = await model.generateContent({
        contents: messages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })) as any,
      });

      const response = await gemRes.response;
      const content = response.text();

      // Google API returns function calls via functionCalls() method
      const functionCallsResult = response.functionCalls();
      const toolCalls =
        functionCallsResult && functionCallsResult.length > 0
          ? functionCallsResult.map((fc: any, idx: number) => ({
              id: `call_${idx}`,
              type: "function" as const,
              function: {
                name: fc.name,
                arguments: JSON.stringify(fc.args || {}),
              },
            }))
          : undefined;

      const chatResponse: ChatResponse = {
        content: content,
        toolCalls: toolCalls,
        service: this.name,
        model: options?.model || this.defaultModel,
      };
      return chatResponse;
    }

    // Streaming response when tools are not used
    const gemRes = await model.generateContentStream(messages as any);

    return (async function* () {
      for await (const chunk of gemRes.stream) {
        yield chunk.text() || "";
      }
    })();
  },
};
