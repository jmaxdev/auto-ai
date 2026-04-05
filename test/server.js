import { Chat } from "../dist-dev/index.js";

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === "/chat" && req.method === "POST") {
      const { messages } = await req.json();
      try {
        const response = await Chat(messages, {
          serviceExclusion: ["Google"], // Exclude Groq, Cerebras, use other providers...
          max_completion_tokens: 900,
          temperature: 0.7,
        });
        return new Response(response, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
          },
          status: 200
        });
      } catch (error) {
        return new Response(error.message, { status: 500 });
      }
    }
    return new Response("Hello World");
  },
  error(error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`Server running at ${server.url}`);