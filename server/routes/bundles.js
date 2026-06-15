import { Router } from "express";
import { groqCall, FAST_MODEL } from "../utils/groqClient.js";

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


// GET /api/bundles — static curated bundles from mockData
router.get("/", async (req, res) => {
  const { bundles } = await import("../data/mockData.js");
  res.json({ bundles });
});

// POST /api/bundles/ai
// Body: { recentOrder: [{id,name,category}], olderOrders: [...], allPurchasedIds: [...], history: [{name}] }
router.post("/ai", async (req, res) => {
  const { recentOrder = [], olderOrders = [], allPurchasedIds = [], history = [] } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ message: "AI service unavailable" });
  }

  if (recentOrder.length === 0) {
    return res.status(400).json({ message: "No recent order provided" });
  }

  // Import prices from mockData for richer AI context
  let productPrices = {};
  try {
    const { products } = await import("../data/mockData.js");
    products.forEach((p) => { productPrices[p.id] = p.price; });
  } catch (_) {}

  const catalogText = CATALOG.map((p) => {
    const price = productPrices[p.id] ? ` ₹${productPrices[p.id].toLocaleString("en-IN")}` : "";
    return `${p.id}: ${p.name} [${p.category}]${price}`;
  }).join("\n");

  const resolveItem = (item) => {
    const c = CATALOG.find((c) => c.id === item.id);
    const name = c?.name || item.name;
    const cat = c?.category || item.category || "";
    return `- ${name}${cat ? ` [${cat}]` : ""}`;
  };

  const recentText = recentOrder.map(resolveItem).join("\n");
  const olderText = olderOrders.length > 0 ? olderOrders.map(resolveItem).join("\n") : "None";
  const historyText = history.slice(0, 5).map((h) => `- ${h.name}`).join("\n");

  const excludeIds = new Set([
    ...allPurchasedIds,
    ...recentOrder.map((i) => i.id),
    ...olderOrders.map((i) => i.id),
  ].filter(Boolean));

  const prompt = `You are a smart personal shopping assistant for an Indian e-commerce platform.
Your job is to suggest product bundles that DIRECTLY complement what the user just bought.

━━━ MOST RECENT ORDER (highest priority — build recommendations around this) ━━━
${recentText}

━━━ PREVIOUSLY PURCHASED (exclude from suggestions) ━━━
${olderText}
${historyText ? `\n━━━ RECENTLY BROWSED ━━━\n${historyText}` : ""}

━━━ FULL CATALOG (ID: Name [category] Price) ━━━
${catalogText}

━━━ CATEGORY COMPLEMENT RULES (follow these strictly) ━━━
grocery / food (coffee, tea, snacks)  → kitchen appliances: kettle, cooker, induction cooktop, air fryer
kitchen appliances                    → other kitchen appliances + personal care (bottles, containers)
tv / streaming                        → audio (soundbar, headphones) + streaming devices
phone                                 → audio accessories (earbuds, headphones) + power bank + USB hub
gaming                                → gaming peripherals: keyboard, mouse, monitor, desk mat
office / laptop / monitor             → desk accessories: stand, lamp, webcam, mouse, cable management, USB hub
smart home                            → more smart home: smart bulb, smart plug, Echo Dot
audio (headphones, earbuds)           → phone, streaming, or office accessories
furniture (chair, desk)               → office or study accessories
personal care                         → other personal care or home items
home / cleaning                       → other home organisation items

IMPORTANT: If the user bought a grocery/food item like coffee, recommend KITCHEN appliances — NOT home storage or furniture. A coffee buyer needs a kettle or induction cooktop, not a laundry basket.

Your task:
1. Look at the most recent order category and apply the complement rules above
2. Create exactly 2 bundles with a coherent theme each — not a random mix
3. Each bundle must stay tightly within the correct complement category

Rules:
- Each bundle: 3–5 product IDs, ONLY exact IDs from the catalog above
- NEVER include products the user already owns
- Title must name the specific theme (e.g. "Complete Your Kitchen Setup", "Level Up Your Gaming Den")
- "reason" must specifically name the product(s) they just bought and explain the direct connection
- "goal" is one sentence: what practical problem does this bundle solve?
- "perItemReasons" maps each productId to a one-line reason why that specific item belongs
- "shoppingContext" is your inference (e.g. "kitchen upgrade", "home office setup", "gaming den")

Confidence rubric (be strict — do not inflate):
- 90–99: Bundle directly completes the ecosystem from the recent order
- 75–89: Strong match, most items clearly useful given what was just bought
- 60–74: Moderate match
- 40–59: Weak, tangential

Return ONLY valid JSON, no markdown, no extra text:
{
  "shoppingContext": "...",
  "bundles": [
    {
      "id": "bundle_1",
      "title": "...",
      "reason": "Since you just bought [exact product name], ...",
      "goal": "...",
      "items": [{"productId": "p..."}],
      "perItemReasons": {"p...": "one-line reason", "p...": "one-line reason"},
      "confidence": 84,
      "tag": "Based on your recent order"
    }
  ]
}`;

  try {
    const completion = await groqCall({
      model: FAST_MODEL,
      max_tokens: 900,
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a product bundle recommender. Return ONLY valid JSON with no markdown fences or extra text." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0].message.content.trim();

    // Strip markdown fences
    let text = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    // Extract the outermost JSON object in case there's leading/trailing prose
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }

    // Fix common LLM JSON mistakes:
    // 1. Trailing commas before } or ]
    text = text.replace(/,(\s*[}\]])/g, "$1");
    // 2. Unescaped newlines inside string values
    text = text.replace(/:\s*"((?:[^"\\]|\\.)*)"/g, (match) =>
      match.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
    );

    const parsed = JSON.parse(text);

    const validIds = new Set(CATALOG.map((p) => p.id));

    parsed.bundles = (parsed.bundles || [])
      .map((bundle) => ({
        ...bundle,
        items: (bundle.items || []).filter(
          (i) => validIds.has(i.productId) && !excludeIds.has(i.productId)
        ),
      }))
      .filter((b) => b.items.length >= 2);

    res.json(parsed);
  } catch (err) {
    console.error("Bundle AI error:", err?.message);
    res.status(500).json({ message: "Failed to generate bundles", error: err?.message });
  }
});

export default router;
