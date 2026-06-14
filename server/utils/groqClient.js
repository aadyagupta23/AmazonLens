import Groq from "groq-sdk";

let client = null;
export function getGroq() {
  if (client) return client;
  if (process.env.GROQ_API_KEY) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

export const PRIMARY_MODEL = "llama-3.3-70b-versatile";
export const FAST_MODEL    = "llama-3.1-8b-instant"; // 500k TPD — much higher limit

// Call Groq, auto-retry with fast model on 429
export async function groqCall({ messages, max_tokens = 300, temperature = 0.2, model = FAST_MODEL }) {
  const groq = getGroq();
  if (!groq) throw new Error("Groq client not initialised");

  const attempt = (m) => groq.chat.completions.create({ model: m, max_tokens, temperature, messages });

  try {
    return await attempt(model);
  } catch (err) {
    const is429 = err?.status === 429 || String(err?.message).includes("rate_limit");
    if (is429 && model !== FAST_MODEL) {
      console.warn(`Groq 429 on ${model} — retrying with ${FAST_MODEL}`);
      return await attempt(FAST_MODEL);
    }
    throw err;
  }
}
