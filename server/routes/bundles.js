import { Router } from "express";
import { groqCall, FAST_MODEL } from "../utils/groqClient.js";
import { getAllProducts } from "./products.js";

const router = Router();


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

  // Build live catalog from full product database (mockData + djProducts)
  const allProducts = await getAllProducts();
  const productById = {};
  allProducts.forEach((p) => { productById[p.id] = p; });

  // Resolve recent order categories from DB (fallback to what client sent)
  const recentCatTerms = recentOrder
    .map((i) => (productById[i.id]?.category || i.category || "").toLowerCase())
    .filter(Boolean);

  // Keywords that each category group maps to in the catalog
  const COMPLEMENT_HINTS = [
    { if: ["audio", "headphone", "speaker", "earphone", "soundbar", "home audio"], suggest: ["mobile", "streaming", "computer", "accessory", "office"] },
    { if: ["mobile", "phone"], suggest: ["audio", "headphone", "earphone", "accessory", "computer"] },
    { if: ["tv", "television"], suggest: ["audio", "speaker", "soundbar", "streaming", "smart home"] },
    { if: ["streaming"], suggest: ["tv", "television", "audio", "smart home"] },
    { if: ["kitchen", "cookware", "cooking", "appliance"], suggest: ["kitchen", "cookware", "grocery", "home & kitchen"] },
    { if: ["grocery", "coffee", "food"], suggest: ["kitchen", "cookware", "home & kitchen"] },
    { if: ["gaming"], suggest: ["gaming", "computer", "monitor", "input", "accessory"] },
    { if: ["computer", "laptop", "office", "monitor"], suggest: ["computer", "office", "monitor", "accessory", "furniture"] },
    { if: ["smart home"], suggest: ["smart home", "accessory", "electronics"] },
    { if: ["beauty", "personal care", "cosmetic"], suggest: ["beauty", "personal care", "fashion", "home"] },
    { if: ["fashion", "clothing", "apparel"], suggest: ["fashion", "beauty", "sports"] },
    { if: ["sports", "fitness"], suggest: ["sports", "fitness", "fashion"] },
    { if: ["book"], suggest: ["books", "office", "stationery"] },
  ];

  const norm = (s) => (s || "").toLowerCase();

  // Score each product: 3 = same category as purchase, 2 = complement, 1 = tangential, 0 = unrelated
  const scoreProduct = (p) => {
    const pCat = norm(p.category);
    for (const term of recentCatTerms) {
      if (pCat.includes(term) || term.includes(pCat)) return 3;
    }
    for (const hint of COMPLEMENT_HINTS) {
      const isRecent = hint.if.some((kw) => recentCatTerms.some((t) => t.includes(kw) || kw.includes(t)));
      if (!isRecent) continue;
      if (hint.suggest.some((kw) => pCat.includes(kw) || kw.includes(pCat))) return 2;
    }
    return 0;
  };

  const scored = allProducts
    .map((p) => ({ p, score: scoreProduct(p) }))
    .sort((a, b) => b.score - a.score);

  // Only pass relevant products to the AI — NO unrelated filler
  // score 3 = same category, score 2 = direct complement
  const relevantProducts = scored.filter((x) => x.score >= 2).map((x) => x.p);
  // If very few relevant products, add same-category products from the purchase itself
  const CATALOG = relevantProducts.length >= 4
    ? relevantProducts.slice(0, 50)
    : scored.filter((x) => x.score >= 1).slice(0, 20).map((x) => x.p);

  // Compute complement category labels for AI prompt
  const complementLabels = [];
  for (const hint of COMPLEMENT_HINTS) {
    const isRecent = hint.if.some((kw) => recentCatTerms.some((t) => t.includes(kw) || kw.includes(t)));
    if (isRecent) complementLabels.push(...hint.suggest);
  }
  const complementDesc = [...new Set(complementLabels)].join(", ") || "accessories that pair with the purchased product";

  const catalogText = CATALOG.map((p) => {
    const price = p.price ? ` ₹${p.price.toLocaleString("en-IN")}` : "";
    return `${p.id}: ${p.name} [${p.category || "general"}]${price}`;
  }).join("\n");

  const resolveItem = (item) => {
    const p = productById[item.id];
    const name = p?.name || item.name;
    const cat = p?.category || item.category || "";
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

━━━ MOST RECENT ORDER (build ALL recommendations around this ONLY) ━━━
${recentText}

━━━ PREVIOUSLY PURCHASED (exclude from suggestions) ━━━
${olderText}
${historyText ? `\n━━━ RECENTLY BROWSED ━━━\n${historyText}` : ""}

━━━ ELIGIBLE CATALOG — ONLY pick IDs from this list ━━━
${catalogText}

━━━ STRICT RULES ━━━
1. The catalog above contains ONLY products relevant to what the user bought. Pick ONLY from it.
2. The correct complement categories for this purchase are: ${complementDesc}
3. NEVER suggest products from unrelated categories (e.g. if user bought a phone, do NOT suggest kitchen, grocery, fashion, books, or furniture).
4. Every item in the bundle must have a clear, logical connection to the purchased product.
5. "reason" must name the exact product they bought and explain the direct connection in one sentence.

━━━ CATEGORY COMPLEMENT RULES ━━━
phone / mobile → earbuds, headphones, power bank, USB hub, phone accessories
audio (speaker, soundbar, headphones) → phone, streaming device, laptop stand, office accessories
tv / television → soundbar, streaming stick, smart bulb, HDMI accessories
streaming device → TV, smart home, audio
kitchen / cookware → other kitchen appliances, food storage
grocery / coffee / food → kettle, induction cooktop, air fryer, kitchen appliances
gaming → gaming keyboard, gaming mouse, gaming monitor, desk mat
office / laptop / monitor → webcam, mouse, laptop stand, USB hub, cable management
smart home → smart bulb, smart plug, Echo Dot
beauty / personal care → other beauty, skincare, fashion
sports / fitness → sports gear, fitness accessories
fashion → other fashion, beauty, sports
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

    const validIds = new Set(allProducts.map((p) => p.id));

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
