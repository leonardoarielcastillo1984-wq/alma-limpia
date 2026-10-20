// Capa de abstracción del motor conversacional.
// Para agregar un proveedor: implementar LlmProvider y registrarlo en getProvider().

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmResult {
  text: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface LlmProvider {
  name: string;
  chat(messages: LlmMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<LlmResult>;
}
