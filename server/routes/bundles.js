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

  const norm = (s) => (s || "").toLowerCase();

  // Precise prefix-based complement rules — keys are exact category prefixes from the DB
  // Uses startsWith matching so "electronics > home audio" ONLY matches "electronics > home audio"
  // and NOT "home & kitchen > furniture" — eliminates false positives from substring matching
  const COMPLEMENT_RULES = [
    {
      purchase: ["electronics > home audio", "electronics > headphones", "electronics > mobile accessories"],
      complement: ["electronics > mobiles", "electronics > streaming", "electronics > computers", "computers > accessories"],
    },
    {
      purchase: ["electronics > mobiles"],
      complement: ["electronics > headphones", "electronics > home audio", "electronics > mobile accessories", "electronics > streaming", "computers > accessories"],
    },
    {
      purchase: ["electronics > televisions"],
      complement: ["electronics > home audio", "electronics > streaming", "electronics > smart home"],
    },
    {
      purchase: ["electronics > streaming"],
      complement: ["electronics > televisions", "electronics > home audio", "electronics > smart home"],
    },
    {
      purchase: ["electronics > smart home"],
      complement: ["electronics > smart home", "electronics > accessories", "electronics > lighting"],
    },
    {
      purchase: ["electronics > computers", "computers >"],
      complement: ["computers > accessories", "computers > input", "computers > monitors", "electronics > accessories", "home & kitchen > furniture"],
    },
    {
      purchase: ["gaming"],
      complement: ["gaming", "computers > input", "computers > monitors", "computers > accessories"],
    },
    {
      purchase: ["kitchen", "home & kitchen > cook"],
      complement: ["kitchen", "home & kitchen", "grocery"],
    },
    {
      purchase: ["grocery"],
      complement: ["kitchen", "home & kitchen > bottles", "home & kitchen > cook"],
    },
    {
      purchase: ["beauty", "beauty > personal care"],
      complement: ["beauty", "fashion"],
    },
    {
      purchase: ["fashion", "fashion >"],
      complement: ["fashion", "beauty", "sports"],
    },
    {
      purchase: ["sports"],
      complement: ["sports", "fashion"],
    },
    {
      purchase: ["books"],
      complement: ["books", "computers > accessories", "home & kitchen > furniture"],
    },
    {
      purchase: ["home & kitchen"],
      complement: ["home & kitchen", "beauty"],
    },
  ];

  // Match a product category against a list of prefixes (exact prefix-based, not substring)
  const matchesAny = (cat, prefixes) =>
    prefixes.some((prefix) => cat === prefix || cat.startsWith(prefix + " >") || cat.startsWith(prefix + ">"));

  // Score each product: 3 = same category, 2 = complement, 0 = unrelated
  const scoreProduct = (p) => {
    const pCat = norm(p.category);
    // Pure grocery/food djProducts are excluded from non-grocery bundles
    if (pCat === "grocery" && !recentCatTerms.some((t) => t.startsWith("grocery") || t.startsWith("kitchen"))) return -1;

    // Same category as any recent purchase → score 3 (exact match or direct parent/child)
    for (const term of recentCatTerms) {
      if (pCat === term || pCat.startsWith(term + " >") || term.startsWith(pCat + " >")) return 3;
    }

    // Check complement rules
    for (const rule of COMPLEMENT_RULES) {
      const isRecent = recentCatTerms.some((t) => matchesAny(t, rule.purchase));
      if (!isRecent) continue;
      if (matchesAny(pCat, rule.complement)) return 2;
    }
    return 0;
  };

  const scored = allProducts
    .map((p) => ({ p, score: scoreProduct(p) }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score);

  // Only pass relevant products to the AI — NO unrelated filler (score must be ≥ 2)
  const CATALOG = scored.slice(0, 60).map((x) => x.p);

  // Compute complement category labels for AI prompt
  const complementLabels = [];
  for (const rule of COMPLEMENT_RULES) {
    const isRecent = recentCatTerms.some((t) => matchesAny(t, rule.purchase));
    if (isRecent) complementLabels.push(...rule.complement);
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
Your job is to suggest product bundles that complement what the user has been buying recently.

━━━ RECENT PURCHASES (last 3-4 orders — build recommendations around these) ━━━
${recentText}

━━━ OLDER PURCHASES (exclude from suggestions) ━━━
${olderText}
${historyText ? `\n━━━ RECENTLY BROWSED ━━━\n${historyText}` : ""}

━━━ ELIGIBLE CATALOG — ONLY pick IDs from this list ━━━
${catalogText}

━━━ STRICT RULES ━━━
1. The catalog above contains ONLY products relevant to what the user recently bought. Pick ONLY from it.
2. The correct complement categories for these purchases are: ${complementDesc}
3. NEVER suggest products from unrelated categories (e.g. if user bought phones/audio, do NOT suggest kitchen, grocery, fashion, or books).
4. Every item in the bundle must have a clear, logical connection to at least one of their recent purchases.
5. "reason" must name the specific product(s) they bought and explain the direct connection in one sentence.

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

Your task:
1. Look at ALL recent purchases and find the dominant category/theme
2. Create exactly 2 bundles that directly complement that theme — tight, coherent, not a random mix
3. Each bundle must stay strictly within the correct complement categories

Rules:
- Each bundle: 3–5 product IDs, ONLY exact IDs from the catalog above
- NEVER include products the user already owns
- Title must name the specific theme (e.g. "Complete Your Audio Setup", "Level Up Your Gaming Den")
- "reason" must name the specific product(s) from recent purchases and explain the connection
- "goal" is one sentence: what practical problem does this bundle solve?
- "perItemReasons" maps each productId to a one-line reason why it belongs given the recent purchases
- "shoppingContext" is your inference (e.g. "audio setup", "home office", "gaming den")

━━━ SIMILARITY SCORE (confidence) — calculate strictly ━━━
The confidence score measures how similar/relevant the bundle is to the user's recent 3-4 orders.
Score each bundle by asking: "If someone bought [recent purchases], how naturally would they want this bundle?"

- 90–99: Every item directly pairs with a specific recent purchase (e.g. bought JBL speaker → Fire TV Stick + earbuds)
- 81–89: Most items clearly useful given recent purchases, theme is obvious
- 70–80: Good match but some items are loosely connected
- 50–69: Weak connection, could apply to many users generically
- Below 50: Unrelated

CRITICAL: Only return bundles with confidence ≥ 81. If you cannot build a bundle with confidence ≥ 81 from the available catalog, return an empty bundles array: {"shoppingContext":"...","bundles":[]}

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

    // Strict: only allow IDs that were actually in the scored catalog — prevents AI hallucinations
    const validCatalogIds = new Set(CATALOG.map((p) => p.id));

    parsed.bundles = (parsed.bundles || [])
      .map((bundle) => ({
        ...bundle,
        items: (bundle.items || []).filter(
          (i) => validCatalogIds.has(i.productId) && !excludeIds.has(i.productId)
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
