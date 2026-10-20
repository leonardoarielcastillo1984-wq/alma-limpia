import type { LlmMessage, LlmProvider, LlmResult } from "./provider";

const API = "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider implements LlmProvider {
  name = "groq";
  private model: string;

  constructor(
    private apiKey: string,
    model?: string
  ) {
    this.model = model ?? "llama-3.3-70b-versatile";
  }

  async chat(messages: LlmMessage[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<LlmResult> {
    const t0 = Date.now();
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: opts.maxTokens ?? 900,
        temperature: opts.temperature ?? 0.75,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Groq ${res.status}: ${txt.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      text: data.choices[0]?.message?.content ?? "",
      provider: this.name,
      model: this.model,
      tokensIn: data.usage?.prompt_tokens ?? 0,
      tokensOut: data.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - t0,
    };
  }
}
