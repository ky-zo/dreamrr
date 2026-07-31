import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";

export const maxDuration = 60;

const runtime = new CopilotRuntime();

export const POST = async (req: Request) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      "OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server.",
      { status: 500, headers: { "content-type": "text/plain" } },
    );
  }

  const openai = new OpenAI({ apiKey });
  const serviceAdapter = new OpenAIAdapter({
    openai,
    model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
  });

  return copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  }).handleRequest(req);
};
