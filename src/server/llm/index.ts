import { GroqProvider } from "./groq";
import { MockProvider } from "./mock";
import type { LlmProvider } from "./provider";

let cached: LlmProvider | null = null;

export function getLlmProvider(): LlmProvider {
  if (cached) return cached;
  const key = process.env.GROQ_API_KEY;
  cached = key
    ? new GroqProvider(key, process.env.GROQ_MODEL)
    : new MockProvider();
  return cached;
}

export * from "./provider";
