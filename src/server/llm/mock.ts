import type { LlmMessage, LlmProvider, LlmResult } from "./provider";

// Proveedor de demostración cuando no hay GROQ_API_KEY.
// Devuelve respuestas naturales basadas en el contexto — marcado como "mock"
// en ai_usage_logs para que el admin lo vea.
const OPENERS = [
  "Gracias por compartirlo conmigo. Tomémonos un momento con esto.",
  "Te escucho. Hay algo importante en lo que traés hoy.",
  "Qué bueno que estás acá. Vamos despacio, a tu ritmo.",
];

const BRIDGES = [
  "Cuando me contás esto, siento que hay un hilo más profundo: no es solo la situación, es lo que significa para vos.",
  "Lo que aparece acá parece pedirte un poco de amabilidad con vos misma/o, antes que una respuesta.",
  "Los símbolos no hablan de destinos escritos: hablan de lo que tu mirada puede iluminar hoy.",
];

const CLOSERS = [
  "¿Qué parte de esto sentís que te toca más fuerte? Podemos seguir por ahí.",
  "Si querés, contame un poco más del contexto y lo miramos juntas/os.",
  "Guardate lo que resuene. El resto, dejalo ir sin culpa.",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export class MockProvider implements LlmProvider {
  name = "mock";

  async chat(messages: LlmMessage[]): Promise<LlmResult> {
    const t0 = Date.now();
    const last = [...messages].reverse().find((m) => m.role === "user");
    const userText = last?.content ?? "";
    const seed = userText.length + (userText.charCodeAt(0) || 0);
    const hasCards = /Carta|cartas|tirada|arcan/i.test(userText) || messages.some((m) => m.role === "system" && /tarot/i.test(m.content));

    const parts = [pick(OPENERS, seed)];
    if (hasCards) {
      parts.push(
        "Las cartas que salieron dibujan un movimiento: algo que viene pidiendo espacio quiere ser mirado, no resuelto de golpe. La clave no está en la respuesta perfecta sino en la pregunta honesta."
      );
    }
    parts.push(pick(BRIDGES, seed >> 2), pick(CLOSERS, seed >> 4));

    await new Promise((r) => setTimeout(r, 350)); // latencia mínima realista
    return {
      text: parts.join("\n\n"),
      provider: "mock",
      model: "demo-es-ar",
      tokensIn: Math.ceil(JSON.stringify(messages).length / 4),
      tokensOut: 120,
      latencyMs: Date.now() - t0,
    };
  }
}
