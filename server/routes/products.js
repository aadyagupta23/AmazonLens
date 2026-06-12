import { Router } from "express";
import Groq from "groq-sdk";
import { products, bundles } from "../data/mockData.js";

const router = Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const queryCache = new Map();

const BUNDLE_DETECTION_PROMPT = `You are a search intent classifier. Given a search query, respond ONLY with valid JSON, no markdown, no explanation:
{ "type": "bundle" | "product", "category": "home theatre" | "audio" | "mobile" | null }

Rules:
- "bundle" if the query implies buying multiple complementary products together (e.g. "home theatre setup", "gaming setup", "office desk setup")
- "product" for everything else`;

router.get("/", (req, res) => {
  const { category, limit } = req.query;
  let result = [...products];
  if (category) result = result.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
  if (limit) result = result.slice(0, parseInt(limit));
  res.json({ products: result });
});

router.get("/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ product });
});

router.post("/search", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.json({ type: "product", products });

  const q = query.toLowerCase().trim();

  // Check keyword patterns first (fast path, no Groq needed)
  const bundleKeywords = ["setup", "combo", "kit", "bundle", "package", "system"];
  const homeTheatreKeywords = ["home theatre", "home theater", "theatre", "theater"];
  const isHomeTheatre = homeTheatreKeywords.some((k) => q.includes(k));
  const hasBundle = bundleKeywords.some((k) => q.includes(k));

  if (isHomeTheatre || (hasBundle && (q.includes("tv") || q.includes("sound") || q.includes("audio")))) {
    const bundle = bundles[0];
    const bundleProducts = products.filter((p) => bundle.products.includes(p.id));
    const allProducts = products.filter((p) => p.category.includes("Television") || p.category.includes("Audio"));
    return res.json({ type: "bundle", bundle, products: allProducts, bundleProducts });
  }

  // Groq classification for ambiguous queries
  if (groq && !queryCache.has(q)) {
    try {
      const chat = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: BUNDLE_DETECTION_PROMPT },
          { role: "user", content: query }
        ],
        max_tokens: 80,
        temperature: 0
      });
      const raw = chat.choices[0].message.content.trim();
      const parsed = JSON.parse(raw);
      queryCache.set(q, parsed);
    } catch {
      queryCache.set(q, { type: "product", category: null });
    }
  }

  const classification = queryCache.get(q) || { type: "product" };

  if (classification.type === "bundle") {
    const bundle = bundles[0];
    const bundleProducts = products.filter((p) => bundle.products.includes(p.id));
    return res.json({ type: "bundle", bundle, products, bundleProducts });
  }

  // Filter by search terms
  const terms = q.split(" ").filter((t) => t.length > 2);
  const filtered = products.filter((p) =>
    terms.some(
      (t) =>
        p.name.toLowerCase().includes(t) ||
        p.brand.toLowerCase().includes(t) ||
        p.category.toLowerCase().includes(t)
    )
  );

  res.json({ type: "product", products: filtered.length > 0 ? filtered : products });
});

export default router;
