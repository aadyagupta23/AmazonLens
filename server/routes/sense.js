import { Router } from "express";
import jwt from "jsonwebtoken";
import { senseItems } from "../data/mockData.js";
import { stockInventory, isLowStock, getStockInfo } from "../data/stockInventory.js";
import { getAllProducts } from "./products.js";
import { computeProductScore, computeDeliveryRate } from "../utils/trustFormula.js";
import { computeProductTrustScore, getProductStats } from "../data/customers.js";
import { getCompanyByName } from "../data/companies.js";
import DnaProfile from "../models/DnaProfile.js";
import { groqCall, FAST_MODEL, PRIMARY_MODEL } from "../utils/groqClient.js";

// ── Suspicious review scanner ──────────────────────────────────────────────────
const suspiciousCache = new Map(); // productId → { flagged, ts }
const CACHE_TTL = 5 * 60 * 1000;  // 5 min

async function scanForSuspiciousReviews(productId, reviews) {
  const cached = suspiciousCache.get(productId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.flagged;

  if (!reviews || reviews.length === 0) return [];

  const slim = reviews.map((r) => ({
    id: r.id,
    author: r.author,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verified: r.verified ?? false,
    helpful: r.helpful ?? 0,
  }));

  const prompt = `You are a fake-review detection system. Analyze the following product reviews and identify any that show suspicious or inauthentic patterns.

Suspicious signals to look for:
- All-caps text or excessive capitalization throughout
- Repetitive filler phrases ("best buy", "don't miss", "top quality" repeated multiple times)
- Generic superlatives with zero product-specific detail
- Bot-like language or obvious spam patterns
- Unverified reviews with 0 helpful votes that give 5 stars
- Multiple reviews that look coordinated (same date, same style, same username pattern)

Reviews:
${JSON.stringify(slim, null, 2)}

Respond with ONLY this JSON — no explanation, no markdown:
{"flagged":[{"id":"<review_id>","reason":"<concise reason, max 12 words>"}]}

If no reviews are suspicious, respond with: {"flagged":[]}
Return at most 3 entries.`;

  // 3-second timeout so seller-trust is never blocked more than ~3s waiting on Groq
  const scan = async () => {
    const resp = await groqCall({
      model: FAST_MODEL,
      max_tokens: 200,
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.choices?.[0]?.message?.content?.trim() || "{}";
    const jsonStart = text.indexOf("{");
    const parsed = JSON.parse(text.slice(jsonStart));
    const flaggedIds = new Set((parsed.flagged || []).map((f) => f.id));
    const reasonMap = Object.fromEntries((parsed.flagged || []).map((f) => [f.id, f.reason]));
    const result = reviews
      .filter((r) => flaggedIds.has(r.id))
      .slice(0, 3)
      .map((r) => ({ ...r, aiReason: reasonMap[r.id] || "Flagged by AI analysis" }));
    suspiciousCache.set(productId, { flagged: result, ts: Date.now() });
    return result;
  };

  const timeoutGuard = new Promise((resolve) => setTimeout(() => resolve([]), 3000));

  try {
    return await Promise.race([scan(), timeoutGuard]);
  } catch {
    return [];
  }
}

const router = Router();

// ─── Auth helper ─────────────────────────────────────────────────────────────
function extractUserId(req) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || null;
  } catch { return null; }
}

async function getOrCreate(userId, guestId) {
  if (userId) {
    let p = await DnaProfile.findOne({ userId });
    if (!p) p = await DnaProfile.create({ userId });
    return p;
  }
  if (guestId) {
    let p = await DnaProfile.findOne({ guestId });
    if (!p) p = await DnaProfile.create({ guestId });
    return p;
  }
  return null;
}

function recompute(profile) {
  const events = profile.events;
  const brandScores = {}, catScores = {}, purchasePrices = [];
  const returnsByCategory = {}, purchasesByCategory = {};

  for (const e of events) {
    const w = e.type === "purchase" ? 3 : e.type === "cart_add" ? 2 : e.type === "view" ? 1 : -2;
    if (e.brand) brandScores[e.brand] = (brandScores[e.brand] || 0) + w;
    if (e.category) catScores[e.category] = (catScores[e.category] || 0) + w;
    if (e.type === "purchase" && e.price > 0) { purchasePrices.push(e.price); purchasesByCategory[e.category] = (purchasesByCategory[e.category] || 0) + 1; }
    if (e.type === "return" && e.category) returnsByCategory[e.category] = (returnsByCategory[e.category] || 0) + 1;
  }

  profile.preferredBrands = Object.entries(brandScores).filter(([,s]) => s > 0).sort((a,b) => b[1]-a[1]).slice(0,8).map(([brand,score]) => ({brand,score}));
  profile.preferredCategories = Object.entries(catScores).filter(([,s]) => s > 0).sort((a,b) => b[1]-a[1]).slice(0,8).map(([category,score]) => ({category,score}));

  if (purchasePrices.length > 0) {
    profile.budgetRange = { min: Math.min(...purchasePrices), max: Math.max(...purchasePrices), avg: Math.round(purchasePrices.reduce((s,p) => s+p, 0) / purchasePrices.length) };
  }

  const purchases = events.filter(e => e.type === "purchase");
  const ecoPurchases = purchases.filter(e => e.sustainable);
  profile.sustainabilityAffinity = purchases.length > 0 ? parseFloat((ecoPurchases.length / purchases.length).toFixed(2)) : 0;

  profile.returnPatterns = Object.entries(returnsByCategory).map(([category, returnCount]) => {
    const purchaseCount = purchasesByCategory[category] || 1;
    return { category, returnCount, purchaseCount, returnRate: parseFloat((returnCount / purchaseCount).toFixed(2)) };
  });

  const returnEvents = events.filter(e => e.type === "return");
  profile.returnedProductIds = [...new Set(returnEvents.map(e => e.productId))];
  profile.returnedBrands = [...new Set(returnEvents.map(e => e.brand).filter(Boolean))];
  profile.purchasedProductIds = [...new Set(events.filter(e => e.type === "purchase").map(e => e.productId))];
  if (profile.events.length > 200) profile.events = profile.events.slice(-200);
}

// ══════════════════════════════════════════════════════════════════════════════
// PURCHASE TIMING INTELLIGENCE (existing)
// ══════════════════════════════════════════════════════════════════════════════

router.get("/predictions", (_req, res) => {
  const sorted = [...senseItems].sort((a, b) => b.daysOverdue - a.daysOverdue);
  res.json({ predictions: sorted });
});

// ─── GET /api/sense/stock/:productId ─────────────────────────────────────────
router.get("/stock/:productId", (req, res) => {
  const info = getStockInfo(req.params.productId);
  if (!info) return res.json({ stock: null, lowStock: false });
  res.json({ stock: info.stock, threshold: info.threshold, lowStock: info.stock <= info.threshold });
});

// ─── GET /api/sense/stock-batch ──────────────────────────────────────────────
// Accepts ?ids=p001,p002,p005 and returns stock info for multiple products
router.get("/stock-batch", (req, res) => {
  const ids = (req.query.ids || "").split(",").filter(Boolean);
  const result = {};
  ids.forEach((id) => {
    const info = getStockInfo(id);
    if (info) {
      result[id] = { stock: info.stock, threshold: info.threshold, lowStock: info.stock <= info.threshold };
    }
  });
  res.json({ stockData: result });
});

// ══════════════════════════════════════════════════════════════════════════════
// PREFERENCE INTELLIGENCE (DNA routes)
// ══════════════════════════════════════════════════════════════════════════════

router.post("/event", async (req, res) => {
  const { type, productId, category, brand, price, sustainable, guestId } = req.body;
  if (!type || !productId) return res.status(400).json({ message: "type and productId are required" });

  try {
    const userId = extractUserId(req);
    const profile = await getOrCreate(userId, guestId);
    if (!profile) return res.status(400).json({ message: "userId or guestId required" });

    if (type === "view") {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentView = profile.events.find(e => e.type === "view" && e.productId === productId && new Date(e.at) > tenMinAgo);
      if (recentView) return res.json({ skipped: true });
    }

    profile.events.push({ type, productId, category: category || "", brand: brand || "", price: price || 0, sustainable: !!sustainable });
    recompute(profile);
    try {
      await profile.save();
    } catch (saveErr) {
      // Optimistic concurrency conflict — a sibling request already saved this profile.
      // Treat as success: behavioral data will be captured by the winning save.
      if (saveErr.name === "VersionError" || (saveErr.message && saveErr.message.includes("No matching document"))) {
        return res.json({ ok: true });
      }
      throw saveErr;
    }
    res.json({ ok: true });
  } catch (err) {
    console.warn("Sense /event error (DB may be unavailable):", err.message);
    res.status(503).json({ ok: false, message: "Sense service temporarily unavailable" });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const userId = extractUserId(req);
    const guestId = req.query.guestId;
    const profile = await getOrCreate(userId, guestId);
    if (!profile) return res.status(400).json({ message: "userId or guestId required" });

    const eventCount = profile.events.length;

    // Build purchase-only category + brand maps (excludes view/cart events)
    const purchaseCatMap = {};
    const purchaseBrandByCat = {};
    for (const e of profile.events.filter(ev => ev.type === "purchase")) {
      if (e.category) {
        purchaseCatMap[e.category] = (purchaseCatMap[e.category] || 0) + 1;
        if (e.brand) {
          if (!purchaseBrandByCat[e.category]) purchaseBrandByCat[e.category] = new Set();
          purchaseBrandByCat[e.category].add(e.brand);
        }
      }
    }
    const purchasedCategories = Object.entries(purchaseCatMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category,
        count,
        brands: [...(purchaseBrandByCat[category] || [])],
      }));

    res.json({
      mature: eventCount >= 5,
      eventCount,
      preferredBrands: profile.preferredBrands,
      preferredCategories: profile.preferredCategories,
      purchasedCategories,
      budgetRange: profile.budgetRange,
      sustainabilityAffinity: profile.sustainabilityAffinity,
      returnPatterns: profile.returnPatterns,
      returnedBrands: profile.returnedBrands,
      purchasedCount: profile.purchasedProductIds.length,
      stage: eventCount < 5 ? "seedling" : eventCount < 20 ? "growing" : "established",
    });
  } catch (err) {
    console.warn("Sense /profile error (DB may be unavailable):", err.message);
    res.status(503).json({ message: "Sense service temporarily unavailable" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// TRUSTLENS INTEGRATION
// ══════════════════════════════════════════════════════════════════════════════

router.post("/seller-trust", async (req, res) => {
  const { productId, userReturns = 0 } = req.body || {};
  const allProducts = await getAllProducts();
  const product = allProducts.find(p => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const suspiciousReviewsPromise = scanForSuspiciousReviews(productId, product.reviews || []);

  const sellerName = product.soldBy || "Unknown Seller";
  const company    = getCompanyByName(sellerName);
  const onTime     = computeDeliveryRate(product);
  const sellerYear = product.sellerSince || "2020";
  const sellerAge  = new Date().getFullYear() - parseInt(sellerYear);
  const estOrders  = Math.round(sellerAge * 48000 + (parseFloat(product.soldByRating || 4) - 3) * 25000);
  const ordersLabel = estOrders >= 1_000_000
    ? `${(estOrders / 1_000_000).toFixed(1)}M+`
    : `${Math.round(estOrders / 1000)}k+`;

  const trust = computeProductTrustScore(productId);

  let productScore, status, signals, totalBuyers, formula;

  if (!trust.insufficient) {
    const { returnRate: rData, reorderRate: roData, avgRating: ratingData } = trust.rawMetrics;

    const adjReturnRate  = Math.min(0.60, rData.returnRate + userReturns * 0.03);
    const adjReturnScore = Math.max(0, 35 * (1 - Math.min(adjReturnRate / 0.15, 1)));
    const userPenalty    = Math.min(20, userReturns * 2);

    const raw = adjReturnScore + trust.componentScores.reorderScore + trust.componentScores.reviewScore;
    productScore = Math.max(5, Math.min(98, Math.round(raw) - userPenalty));
    status       = productScore >= 75 ? "VERIFIED" : "TRUSTED";
    totalBuyers  = rData.totalBuyers;

    signals = [
      ratingData.avgRating != null && ratingData.avgRating >= 3.8 && {
        key: "reviews", icon: "Star",
        headline: `${ratingData.avgRating} stars · ${ratingData.totalReviews} verified reviews`,
        subtitle: "Based on verified purchases in our customer database",
        howWeMeasure: `Mean star rating across all ${ratingData.totalReviews} verified reviews. ` +
          `1★ = 0 pts, 5★ = 35 pts (linear). Current avg: ${ratingData.avgRating}★ → ` +
          `${trust.componentScores.reviewScore.toFixed(1)} / 35 pts.`,
      },
      rData.returnRate < 0.12 && {
        key: "keepRate", icon: "PackageOpen",
        headline: rData.returnRate < 0.05
          ? "Under 5% return rate"
          : `Only ${Math.round(rData.returnRate * 100)}% of customers returned this`,
        subtitle: "Most customers keep this item",
        howWeMeasure: `Customer-level return rate across ${rData.totalBuyers} buyers: ` +
          `${Math.round(rData.returnRate * 100)}%. ` +
          `0% → 35 pts, 15%+ → 0 pts. Current: ${trust.componentScores.returnScore.toFixed(1)} / 35 pts.`,
      },
      roData.reorderRate > 0.10 && {
        key: "reorders", icon: "RefreshCw",
        headline: `${Math.round(roData.reorderRate * 100)}% of buyers reordered this`,
        subtitle: "Customers keep coming back",
        howWeMeasure: `Share of buyers who ordered this product more than once: ` +
          `${Math.round(roData.reorderRate * 100)}%. ` +
          `0% → 0 pts, 40%+ → 30 pts. Current: ${trust.componentScores.reorderScore.toFixed(1)} / 30 pts.`,
      },
      onTime >= 90 && {
        key: "delivery", icon: "Truck",
        headline: `${onTime}% on-time delivery`,
        subtitle: "Orders consistently arrive by the promised date",
        howWeMeasure: `Estimated from fulfilment type and seller rating. Fulfilment: ${product.fulfillment || "Merchant"}.`,
      },
      sellerAge >= 3 && {
        key: "tenure", icon: "Store",
        headline: `${sellerAge}-year seller · ${ordersLabel} orders fulfilled`,
        subtitle: "Established seller with a long track record on Amazon",
        howWeMeasure: "Based on seller's Amazon registration date and estimated lifetime order volume.",
      },
    ].filter(Boolean);

    formula = {
      source: "customer_db",
      components: {
        returnScore:  { pts: parseFloat(adjReturnScore.toFixed(2)),                    max: 35, rate: rData.returnRate },
        reorderScore: { pts: parseFloat(trust.componentScores.reorderScore.toFixed(2)), max: 30, rate: roData.reorderRate },
        reviewScore:  { pts: parseFloat(trust.componentScores.reviewScore.toFixed(2)),  max: 35, avg: ratingData.avgRating },
      },
      userPenalty,
      totalBuyers,
    };
  } else {
    const productStats = getProductStats(productId);
    const realRg = productStats.returnRate;
    const realRi = Math.min(1, productStats.reorderRate / 0.45);
    const computed = computeProductScore(product, userReturns, { Rg: realRg, Ri: realRi });
    productScore = computed.productScore;
    status       = computed.status;
    totalBuyers  = productStats.totalBuyers;
    signals      = [];
    formula      = { source: "fallback_insufficient_data", reason: trust.reason };
  }

  const suspiciousReviews = await suspiciousReviewsPromise;

  res.json({
    productScore, status, sellerName, totalBuyers, signals, suspiciousReviews,
    company: company ? {
      verified: company.verified, foundedYear: company.foundedYear,
      category: company.category, fulfillment: company.fulfillment,
      verificationNote: company.verificationNote || null,
      ecoScore: company.ecoScore ?? null,
      ecoLabel: company.ecoLabel ?? null,
      eco: company.eco ?? null,
    } : null,
    formula,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PERSONALIZATION
// ══════════════════════════════════════════════════════════════════════════════

router.get("/risk/:productId", async (req, res) => {
  const { productId } = req.params;
  const userId = extractUserId(req);
  const guestId = req.query.guestId;
  const profile = await getOrCreate(userId, guestId);
  const category = req.query.category || "", brand = req.query.brand || "", price = parseFloat(req.query.price) || 0;

  const warnings = [];
  let riskScore = 0;

  if (profile && profile.events.length >= 3) {
    if (brand && profile.returnedBrands.includes(brand)) { warnings.push({ type: "brand_return", severity: "high", message: `You've returned a ${brand} product before.`, detail: "Products from brands you've returned have a higher chance of disappointing you again." }); riskScore += 35; }
    if (category) { const pattern = profile.returnPatterns.find(p => category.toLowerCase().includes(p.category.toLowerCase()) || p.category.toLowerCase().includes(category.toLowerCase())); if (pattern && pattern.returnRate > 0.3) { warnings.push({ type: "category_pattern", severity: "medium", message: `You return ${Math.round(pattern.returnRate * 100)}% of ${pattern.category} purchases.`, detail: "Your personal history suggests this category tends not to meet your expectations." }); riskScore += 25; } }
    if (price > 0 && profile.budgetRange.avg > 0) { const ratio = price / profile.budgetRange.avg; if (ratio > 2.5) { warnings.push({ type: "price_stretch", severity: "low", message: `This is ${Math.round(ratio)}× your average spend.`, detail: "Big price stretches correlate with buyer's remorse." }); riskScore += 15; } }
    if (profile.purchasedProductIds.includes(productId)) { warnings.push({ type: "already_owned", severity: "info", message: "You've already purchased this product.", detail: "Check your orders page — you might not need another." }); }
  }

  const stats = getProductStats(productId);
  if (stats.returnRate > 0.2 && stats.totalBuyers >= 5) { warnings.push({ type: "community_returns", severity: stats.returnRate > 0.35 ? "high" : "medium", message: `${Math.round(stats.returnRate * 100)}% of buyers returned this product.`, detail: `Based on ${stats.totalBuyers} buyers in our database.` }); riskScore += stats.returnRate > 0.35 ? 30 : 15; }

  riskScore = Math.min(100, riskScore);
  res.json({ productId, riskScore, riskLabel: riskScore >= 60 ? "High Risk" : riskScore >= 30 ? "Moderate Risk" : riskScore > 0 ? "Low Risk" : "No Risk", warnings, hasProfile: !!(profile && profile.events.length >= 3) });
});

router.get("/match/:productId", async (req, res) => {
  const { productId } = req.params;
  const userId = extractUserId(req);
  const guestId = req.query.guestId;
  const profile = await getOrCreate(userId, guestId);
  const category = req.query.category || "", brand = req.query.brand || "";
  const price = parseFloat(req.query.price) || 0, rating = parseFloat(req.query.rating) || 0;

  if (!profile || profile.events.length < 5) {
    return res.json({ score: 0, confident: false, reasons: [], warnings: [], message: "Amazon Sense is still learning your preferences." });
  }

  let score = 50;
  const reasons = [], warnings = [];

  if (brand) {
    const brandEntry = profile.preferredBrands.find(b => b.brand.toLowerCase() === brand.toLowerCase());
    if (brandEntry) { const max = profile.preferredBrands[0]?.score || 1; score += Math.round((brandEntry.score / max) * 25); reasons.push("Similar to products you frequently purchase"); }
    if (profile.returnedBrands.includes(brand)) { score -= 20; warnings.push(`You've returned a ${brand} product before`); }
  }

  if (category) {
    const catEntry = profile.preferredCategories.find(c => category.toLowerCase().includes(c.category.toLowerCase()) || c.category.toLowerCase().includes(category.toLowerCase()));
    if (catEntry) { const max = profile.preferredCategories[0]?.score || 1; score += Math.round((catEntry.score / max) * 20); reasons.push("Matches categories you engage with often"); }
    const rp = profile.returnPatterns.find(p => category.toLowerCase().includes(p.category.toLowerCase()) || p.category.toLowerCase().includes(category.toLowerCase()));
    if (rp && rp.returnRate > 0.3) { score -= 15; warnings.push(`You return ${Math.round(rp.returnRate * 100)}% of ${rp.category} purchases`); }
  }

  if (price > 0 && profile.budgetRange.avg > 0) {
    const ratio = price / profile.budgetRange.avg;
    if (ratio >= 0.5 && ratio <= 1.5) { score += 20; reasons.push("Fits your typical spending range"); }
    else if (ratio >= 0.3 && ratio <= 2.0) { score += 10; }
    else if (ratio > 2.5) { score -= 10; warnings.push(`This is ${Math.round(ratio)}× your average spend`); }
  }

  if (profile.purchasedProductIds.includes(productId)) { score += 5; reasons.push("Similar to products you've kept and rated positively"); }
  else if (brand) { const n = profile.events.filter(e => e.type === "purchase" && e.brand && e.brand.toLowerCase() === brand.toLowerCase()).length; if (n > 0) { score += 15; reasons.push("Similar to products you've kept and rated positively"); } }

  if (rating >= 4.3) { score += 10; reasons.push("Popular among shoppers with similar behavior"); } else if (rating >= 4.0) { score += 5; }
  if (profile.sustainabilityAffinity > 0.5) score += 5;

  score = Math.max(0, Math.min(100, score));

  res.json({
    productId, score, confident: true, reasons, warnings,
    matchLevel: score >= 95 ? "exceptional" : score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "moderate" : "low",
    message: score >= 95 ? "You're very likely to love this product." : score >= 90 ? "This product strongly aligns with your shopping behavior." : score >= 75 ? "This product is a good fit based on your preferences." : score >= 60 ? "This product partially matches your profile." : "This product may not match your usual preferences.",
  });
});

router.post("/match-ai", async (req, res) => {
  const { product, trustScore = 0, orders = [], wishlist = [], cartItems = [], viewHistory = [] } = req.body;
  if (!product?.id) return res.status(400).json({ message: "product required" });

  const recentOrders = orders.slice(0, 4);
  const allOrderItems = orders.flatMap((o) => o.items || []);
  const recentItems = recentOrders.flatMap((o) => o.items || []);

  console.log(`[match-ai] product="${product.name}" orders=${orders.length} orderItems=${allOrderItems.length} wishlist=${wishlist.length} cart=${cartItems.length} views=${viewHistory.length}`);

  const noData = allOrderItems.length === 0 && wishlist.length === 0 && cartItems.length === 0;
  if (noData) {
    console.log("[match-ai] noData → score=0");
    return res.json({ score: 0, confident: false, label: "moderate", reasons: [], warnings: [], summary: "" });
  }

  // Supporting signals for the prompt
  const boughtBefore = allOrderItems.some((i) => i.id === product.id);
  const inWishlist = wishlist.some((i) => i.id === product.id);
  const inCart = cartItems.some((i) => i.id === product.id);
  const viewCount = viewHistory.filter((i) => i.id === product.id).length;
  const avgSpend = allOrderItems.length > 0
    ? Math.round(allOrderItems.reduce((s, i) => s + (i.price || 0), 0) / allOrderItems.length) : 0;
  const budgetRatio = avgSpend > 0 ? (product.price / avgSpend).toFixed(2) : "unknown";
  const returnedIds = new Set(
    orders.flatMap((o) => (o.items || []).filter((i) => i.returned).map((i) => i.id))
  );
  const keepRate = allOrderItems.length > 0
    ? Math.round((1 - returnedIds.size / allOrderItems.length) * 100) : 90;
  const catPurchaseCount = allOrderItems.filter(
    (i) => (i.category || "").toLowerCase() === (product.category || "").toLowerCase()
  ).length;
  const brandPurchaseCount = allOrderItems.filter(
    (i) => product.brand && (i.brand || "").toLowerCase() === (product.brand || "").toLowerCase()
  ).length;

  const recentText = recentItems.length > 0
    ? recentItems.map((i) => `- ${i.name} [${i.category || "?"}]${i.brand ? ` by ${i.brand}` : ""}`).join("\n")
    : "No recent purchases";

  const wishlistText = wishlist.length > 0
    ? wishlist.slice(0, 5).map((i) => `- ${i.name || i.id} [${i.category || "?"}]`).join("\n")
    : "Empty";

  const cartText = cartItems.length > 0
    ? cartItems.map((i) => `- ${i.name || i.id} [${i.category || "?"}]`).join("\n")
    : "Empty";

  if (!process.env.GROQ_API_KEY) {
    const catMatch = catPurchaseCount > 0;
    let score = catMatch ? 75 : 50;
    if (inWishlist || inCart) score += 15;
    if (avgSpend > 0 && budgetRatio !== "unknown" && parseFloat(budgetRatio) <= 2) score += 10;
    score = Math.min(100, score);
    return res.json({
      score,
      confident: score >= 80,
      label: score >= 90 ? "pick_me" : score >= 80 ? "recommended" : "moderate",
      reasons: catMatch ? ["Matches your recent purchase categories"] : ["Based on your wishlist"],
      warnings: [],
      summary: score >= 80 ? "Good fit based on your recent orders." : "",
    });
  }

  const prompt = `You are Amazon Sense — a purchase intelligence engine. Your job is to decide whether a product is a natural NEXT BUY for this user based on their recent purchases.

━━━ PRODUCT BEING VIEWED ━━━
Name: ${product.name}
Category: ${product.category || "Unknown"}
Brand: ${product.brand || "Unknown"}
Price: ₹${product.price}
Rating: ${product.rating || "?"}/5 (${product.reviewCount || 0} reviews)
TrustLens score: ${trustScore}/100

━━━ USER'S RECENT PURCHASES (last 3-4 orders — most important) ━━━
${recentText}

━━━ ADDITIONAL CONTEXT ━━━
Wishlist:
${wishlistText}
Cart:
${cartText}
Viewed this product: ${viewCount} time(s)
Previously bought this exact product: ${boughtBefore ? "yes" : "no"}
Past purchases in same category: ${catPurchaseCount}
Past purchases from same brand: ${brandPurchaseCount}
User's average spend: ₹${avgSpend} (this product is ${budgetRatio}x their avg)
Keep rate (non-returns): ${keepRate}%

━━━ CATEGORY COMPLEMENT RULES ━━━
grocery/food (coffee, tea, snacks) → kitchen: kettle, cooker, induction cooktop, air fryer
kitchen appliances → other kitchen appliances + personal care (bottles, containers)
tv/streaming → audio: soundbar, headphones + streaming devices (Fire Stick, Echo)
phone → audio: earbuds, headphones + power bank + USB hub
gaming → gaming peripherals: keyboard, mouse, gaming monitor, desk mat
office/laptop/monitor → desk accessories: stand, lamp, webcam, mouse, cable organiser, USB hub
smart home → more smart home: smart bulb, smart plug, Echo Dot
audio (headphones/earbuds) → phone, streaming, or office accessories
furniture (chair, desk) → office or study accessories
personal care → other personal care or home items
home/cleaning → home organisation items

━━━ SCORING RULES (follow exactly) ━━━

Score 90–100 ("Pick Me") when:
- This product is the SAME TYPE as a recently ordered product but a different brand
  Example: user bought Nescafé coffee → another coffee brand scores 90+
  Example: user bought Sony TV → another TV brand scores 90+
- User has bought in this exact category multiple times (repeat buyer)
- Budget fits within 1.5x average spend AND TrustLens ≥ 75

Score 80–89 ("Recommended") when:
- This product COMPLEMENTS a recent purchase (different but used together)
  Example: user bought coffee → kettle, induction cooktop, air fryer score 80–89
  Example: user bought TV → soundbar, HDMI cable, Fire Stick score 80–89
  Example: user bought phone → earbuds, power bank, USB hub score 80–89
- Budget is reasonable (under 2x average spend)

Score 60–79: Tangential — loose connection to recent purchases
Score below 60: No meaningful link to any recent purchase
Score 0: No purchase, wishlist, or cart data at all

Rules:
- NEVER score 80+ if the product has zero connection to recent purchases
- If product is already owned (boughtBefore=yes), score 50 max
- Write reasons that NAME the specific product the user bought
  Good: "You bought Nescafé — this kettle is essential for brewing."
  Bad: "Matches your purchase history."
- Keep each reason under 14 words
- Include warnings ONLY for genuine issues (budget >2x, returned this category before)

Respond ONLY with valid JSON, no markdown:
{"score":<0-100>,"reasons":["...","..."],"warnings":[],"summary":"<one sentence max 15 words>"}`;

  try {
    const completion = await groqCall({
      model: FAST_MODEL,
      max_tokens: 350,
      temperature: 0.1,
      messages: [
        { role: "system", content: "You are a purchase complement scoring engine. Return ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0].message.content.trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const text = raw.slice(firstBrace, lastBrace + 1).replace(/,(\s*[}\]])/g, "$1");
    const parsed = JSON.parse(text);
    const score = Math.max(0, Math.min(100, parseInt(parsed.score) || 0));

    console.log(`[match-ai] Groq score=${score} reasons=${(parsed.reasons || []).length}`);

    res.json({
      score,
      confident: score >= 70,
      label: score >= 90 ? "pick_me" : score >= 80 ? "recommended" : "moderate",
      reasons: parsed.reasons || [],
      warnings: parsed.warnings || [],
      summary: parsed.summary || "",
    });
  } catch (err) {
    console.warn("[match-ai] Groq error:", err.message);
    res.status(500).json({ message: "Match scoring unavailable" });
  }
});

router.get("/recommendations", async (req, res) => {
  const userId = extractUserId(req);
  const guestId = req.query.guestId;
  const profile = await getOrCreate(userId, guestId);
  if (!profile || profile.events.length < 3) return res.json({ recommendations: [], reason: "Not enough data yet" });

  const allProducts = await getAllProducts();
  const purchasedIds = new Set(profile.purchasedProductIds || []);
  const viewedIds = new Set(profile.events.filter(e => e.type === "view").map(e => e.productId));
  const preferredBrandMap = {}; (profile.preferredBrands || []).forEach(b => { preferredBrandMap[b.brand.toLowerCase()] = b.score; });
  const preferredCatMap = {}; (profile.preferredCategories || []).forEach(c => { preferredCatMap[c.category.toLowerCase()] = c.score; });
  const returnedBrandsSet = new Set((profile.returnedBrands || []).map(b => b.toLowerCase()));

  const scored = allProducts.filter(p => !purchasedIds.has(p.id)).map(p => {
    let score = 0; const reasons = [];
    const brandKey = (p.brand || "").toLowerCase();
    if (preferredBrandMap[brandKey]) { score += preferredBrandMap[brandKey] * 3; reasons.push("Matches your preferred brands"); }
    const catKey = (p.category || "").toLowerCase();
    for (const [prefCat, catScore] of Object.entries(preferredCatMap)) { if (catKey.includes(prefCat) || prefCat.includes(catKey)) { score += catScore * 2; reasons.push("Fits your category interests"); break; } }
    if (profile.budgetRange.avg > 0 && p.price > 0) { const ratio = p.price / profile.budgetRange.avg; if (ratio >= 0.5 && ratio <= 2.0) { score += 10; reasons.push("Fits your typical budget"); } }
    if (returnedBrandsSet.has(brandKey)) score -= 20;
    if (p.rating >= 4.3) score += 5;
    if (!viewedIds.has(p.id)) score += 3;
    return { ...p, _senseScore: score, _senseReasons: reasons };
  }).filter(p => p._senseScore > 0).sort((a,b) => b._senseScore - a._senseScore).slice(0,12).map(p => ({
    id: p.id, name: p.name, brand: p.brand, category: p.category, price: p.price, originalPrice: p.originalPrice, discount: p.discount, rating: p.rating, reviewCount: p.reviewCount, thumbnail: p.thumbnail || p.images?.[0], isPrime: p.isPrime, delivery: p.delivery, trustScore: p.trustScore || p.productScore,
    senseMatch: p._senseReasons[0] || "Recommended for you", senseScore: p._senseScore, dnaMatch: p._senseReasons[0] || "Recommended for you", dnaScore: p._senseScore,
  }));

  res.json({ recommendations: scored });
});

router.post("/analyze", async (req, res) => {
  const { productId } = req.body || {};
  const allProducts = await getAllProducts();
  const product = allProducts.find(p => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });
  const reviews = product.reviews || [];
  const suspicious = reviews.filter(r => r.suspicious).length;
  const score = Math.max(5, Math.min(98, 90 - Math.round((suspicious / Math.max(1, reviews.length)) * 60)));
  res.json({ analysis: { trustScore: score, totalReviews: reviews.length } });
});

export default router;
