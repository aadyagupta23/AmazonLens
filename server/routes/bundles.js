import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

// Full catalog for the AI prompt
const CATALOG = [
  { id: "p001", name: 'Sony Bravia 55" 4K Smart TV', category: "tv" },
  { id: "p002", name: "JBL Cinema SB271 2.1 Soundbar", category: "audio" },
  { id: "p003", name: "Apple iPhone 15 128GB", category: "phone" },
  { id: "p004", name: "boAt Airdopes 141 TWS Earbuds", category: "audio" },
  { id: "p005", name: "Nescafé Gold Blend Coffee 200g", category: "grocery" },
  { id: "p006", name: 'Samsung 43" Crystal 4K Smart TV', category: "tv" },
  { id: "p007", name: "Prestige Hard Anodised Pressure Cooker 5L", category: "kitchen" },
  { id: "p008", name: "Fire TV Stick 4K Max (2023)", category: "streaming" },
  { id: "p009", name: "EcoSmile Bamboo Toothbrush Pack of 4", category: "personal care" },
  { id: "p010", name: "Milton Thermosteel Water Bottle 1L", category: "personal care" },
  { id: "p011", name: "Classmate Recycled Paper Notebook Pack 6-pack", category: "stationery" },
  { id: "p012", name: "Bewakoof Organic Cotton T-Shirt", category: "fashion" },
  { id: "p013", name: "Amazon Basics Reusable Grocery Bag Set 5-pack", category: "home" },
  { id: "p014", name: "Wipro Next 12W LED Smart Bulb", category: "smart home" },
  { id: "p015", name: "Ambrane Solar Power Bank 20000mAh", category: "accessories" },
  { id: "p016", name: "Gala Eco Cleaning Kit", category: "home" },
  { id: "p017", name: "GreenSoul Ergonomic High-Back Study Chair", category: "furniture" },
  { id: "p018", name: "Portronics Adjustable Aluminium Laptop Stand", category: "office" },
  { id: "p019", name: "Philips LED Study Lamp with Dimming", category: "office" },
  { id: "p020", name: "Amazon Basics Desk Cable Management Sleeve Kit", category: "office" },
  { id: "p021", name: "Redragon K551 Mechanical Gaming Keyboard", category: "gaming" },
  { id: "p022", name: "Logitech M235 Wireless Mouse", category: "office" },
  { id: "p023", name: 'LG 24" Full HD IPS Monitor', category: "monitor" },
  { id: "p024", name: "Logitech C270 HD Webcam", category: "office" },
  { id: "p025", name: "Anker 7-in-1 USB-C Hub", category: "accessories" },
  { id: "p026", name: "JBL Tune 760NC Noise Cancelling Headphones", category: "audio" },
  { id: "p027", name: "Cosmic Byte XL Desk Mat", category: "gaming" },
  { id: "p028", name: "Philips Digital Air Fryer 4L", category: "kitchen" },
  { id: "p029", name: "Prestige Electric Kettle 1.5L", category: "kitchen" },
  { id: "p030", name: "Pigeon 1800W Induction Cooktop", category: "kitchen" },
  { id: "p031", name: "Cello Plastic Laundry Basket with Lid", category: "home" },
  { id: "p032", name: "Solimo Modular Storage Organizer Drawers", category: "home" },
  { id: "p033", name: "Wipro Garnet LED Dimmable Bedside Lamp", category: "home" },
  { id: "p034", name: "Razer DeathAdder Essential Gaming Mouse", category: "gaming" },
  { id: "p035", name: "Corsair K55 RGB PRO Gaming Keyboard", category: "gaming" },
  { id: "p036", name: 'Samsung 27" Odyssey G3 Gaming Monitor 144Hz', category: "gaming" },
  { id: "p037", name: "Amazon Echo Dot (5th Gen)", category: "smart home" },
  { id: "p038", name: "Wipro 16A Smart Plug", category: "smart home" },
];

let groq = null;
function getGroq() {
  if (groq) return groq;
  try {
    if (process.env.GROQ_API_KEY) {
      groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
  } catch (_) {}
  return groq;
}

// POST /api/bundles/ai
// Body: { orders: [{ name, id, category }], history: [{ name }] }
router.post("/ai", async (req, res) => {
  const { orders = [], history = [] } = req.body;

  if (!getGroq()) {
    return res.status(503).json({ message: "AI service unavailable" });
  }

  if (orders.length === 0) {
    return res.status(400).json({ message: "No orders provided" });
  }

  const catalogText = CATALOG.map((p) => `${p.id}: ${p.name} [${p.category}]`).join("\n");

  const orderedText = orders
    .slice(0, 10)
    .map((o) => `- ${o.name}${o.category ? ` (${o.category})` : ""}`)
    .join("\n");

  const historyText = history.slice(0, 5).map((h) => `- ${h.name}`).join("\n");

  const prompt = `You are a smart bundle recommender for an Indian e-commerce platform.

The user has ordered:
${orderedText}
${historyText ? `\nRecently browsed:\n${historyText}` : ""}

Available product catalog (ID: Name [category]):
${catalogText}

Based ONLY on the user's actual orders and browsing history, suggest 2 complementary product bundles.
Each bundle must:
- Contain 3–5 product IDs from the catalog above (ONLY use exact IDs from the list)
- NOT include products the user already ordered
- Have a specific title and reason referencing what they actually bought
- Feel genuinely useful and personally relevant

Return ONLY valid JSON (no markdown, no explanation):
{
  "bundles": [
    {
      "id": "bundle_1",
      "title": "...",
      "reason": "...",
      "items": [{"productId": "p..."}],
      "confidence": 85,
      "tag": "Based on your orders"
    }
  ]
}`;

  try {
    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are a product bundle recommender. Return only valid JSON with no markdown." },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices[0].message.content.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);

    // Validate product IDs exist in catalog
    const validIds = new Set(CATALOG.map((p) => p.id));
    const orderedIds = new Set(orders.map((o) => o.id).filter(Boolean));

    parsed.bundles = (parsed.bundles || []).map((bundle) => ({
      ...bundle,
      items: (bundle.items || []).filter((i) => validIds.has(i.productId) && !orderedIds.has(i.productId)),
    })).filter((b) => b.items.length >= 2);

    res.json(parsed);
  } catch (err) {
    console.error("Bundle AI error:", err?.message);
    res.status(500).json({ message: "Failed to generate bundles", error: err?.message });
  }
});

export default router;
