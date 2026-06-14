import { Router } from "express";
import Groq from "groq-sdk";
import { products } from "../data/mockData.js";

const router = Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const FALLBACK_RESPONSES = {
  w001: "Honestly it's been great for our family room in Bengaluru. Picture quality is sharp — we mainly watch cricket and movies. The Bengaluru hard water isn't kind to electronics, but this TV has held up perfectly in 8 months. Setup took about 30 minutes. Would recommend.",
  w002: "After 14 months it's still working perfectly in our Mumbai apartment. Main complaint is the remote — feels a bit flimsy. But the display itself, no issues. Mumbai humidity hasn't bothered it either. My family of 3 watches it every evening.",
  w003: "I'd think twice if you're expecting premium build quality. The picture is fine for the price, but I noticed some backlight bleed after a few months here in Delhi. For a couple doing occasional movie nights, it's adequate. But I wouldn't call it impressive.",
  default: "It's a solid product overall. Been using it for several months without major issues. Happy to answer specific questions about the experience."
};

router.get("/:productId", (req, res) => {
  const product = products.find((p) => p.id === req.params.productId);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ witnesses: product.witnesses || [] });
});

router.post("/chat", async (req, res) => {
  const { productId, witnessId, message, history = [], witnessContext } = req.body;

  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ reply: FALLBACK_RESPONSES.default });

  // witnessContext is sent when a live witness falls back to AI
  const witness = witnessContext || product.witnesses?.find((w) => w.id === witnessId);
  if (!witness) return res.status(404).json({ reply: FALLBACK_RESPONSES.default });

  if (!groq) {
    return res.json({ reply: FALLBACK_RESPONSES[witnessId] || FALLBACK_RESPONSES.default });
  }

  const systemPrompt = `You are ${witness.name}, a real Amazon customer from ${witness.city}, India.
You purchased the ${product.name} ${witness.monthsOwned} months ago.
You live with a family of ${witness.familySize || 3}.
You ${witness.wouldBuyAgain ? "would" : "would NOT"} buy this product again.
Purchase price you paid: ₹${product.price.toLocaleString("en-IN")}.

Respond conversationally, like a real person texting a friend — not a review.
Be honest, specific, and personal. Keep to 2-4 sentences maximum.
Never say you are an AI, assistant, or language model.
If asked about hard water or water quality: mention ${witness.city} specifically.
If asked about picture quality: reference your actual viewing setup (family room, bedroom, etc).
If asked about cricket or sports: say whether the TV handles fast motion well.
Use natural Indian English — contractions, slight informality is fine.`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    const chat = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages,
      max_tokens: 200,
      temperature: 0.75
    });

    res.json({ reply: chat.choices[0].message.content.trim() });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.json({ reply: FALLBACK_RESPONSES[witnessId] || FALLBACK_RESPONSES.default });
  }
});

export default router;
