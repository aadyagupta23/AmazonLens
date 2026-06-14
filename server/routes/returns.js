import { Router } from "express";
import { groqCall, FAST_MODEL } from "../utils/groqClient.js";

const router = Router();

// POST /api/returns/suggestions
// Body: { productId, productName, brand, category }
router.post("/suggestions", async (req, res) => {
  const { productId, productName, brand = "", category = "" } = req.body;

  if (!process.env.GROQ_API_KEY) return res.status(503).json({ message: "AI service unavailable" });
  if (!productName) return res.status(400).json({ message: "productName is required" });

  const { products } = await import("../data/mockData.js");

  // Exclude the returned product and same brand
  const candidates = products.filter(
    (p) => p.id !== productId && (p.brand || "").toLowerCase() !== brand.toLowerCase()
  );

  const catalogText = candidates.map((p) =>
    `${p.id} | "${p.name}" | brand: ${p.brand} | category: ${p.category} | price: ₹${p.price?.toLocaleString("en-IN")} | rating: ${p.rating}/5 | stock: ${p.inStock ? "yes" : "no"}`
  ).join("\n");

  const prompt = `A customer just RETURNED: "${productName}" (brand: "${brand}", category: "${category}").

They were dissatisfied with this brand. Your job: pick exactly 3 products from the catalog that are the BEST alternatives — same type/use-case, strictly DIFFERENT brand from "${brand}", and must be in stock.

Scoring criteria (rank by these in order):
1. Same category or very similar use-case (most important)
2. Competitive price relative to the returned item
3. High rating (prefer 4.0+)
4. Different brand (mandatory)

CATALOG:
${catalogText}

Return ONLY valid JSON, no markdown:
{
  "suggestions": [
    { "id": "pXXX", "reason": "one punchy sentence why this is better or different" },
    { "id": "pXXX", "reason": "..." },
    { "id": "pXXX", "reason": "..." }
  ]
}`;

  try {
    const completion = await groqCall({
      model: FAST_MODEL,
      temperature: 0.2,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    const suggestions = (parsed.suggestions || [])
      .filter((s) => s.id && candidates.find((c) => c.id === s.id))
      .slice(0, 3)
      .map((s) => {
        const p = candidates.find((c) => c.id === s.id);
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          price: p.price,
          originalPrice: p.originalPrice || null,
          discount: p.discount || null,
          rating: p.rating || null,
          reviewCount: p.reviewCount || null,
          thumbnail: p.thumbnail || null,
          inStock: p.inStock,
          isPrime: p.isPrime || false,
          reason: s.reason,
        };
      });

    return res.json({ suggestions });
  } catch (err) {
    console.error("Returns suggestions error:", err.message);
    return res.status(500).json({ message: "Failed to generate suggestions" });
  }
});

export default router;
