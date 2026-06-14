import { Router } from "express";
import jwt from "jsonwebtoken";
import { senseItems } from "../data/mockData.js";
import { getAllProducts } from "./products.js";
import { computeProductScore, computeDeliveryRate } from "../utils/trustFormula.js";
import { getProductStats } from "../data/customers.js";
import { getCompanyByName } from "../data/companies.js";
import DnaProfile from "../models/DnaProfile.js";

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

router.get("/predictions", (req, res) => {
  const sorted = [...senseItems].sort((a, b) => b.daysOverdue - a.daysOverdue);
  res.json({ predictions: sorted });
});

// ══════════════════════════════════════════════════════════════════════════════
// PREFERENCE INTELLIGENCE (merged from DNA)
// ══════════════════════════════════════════════════════════════════════════════

router.post("/event", async (req, res) => {
  const { type, productId, category, brand, price, sustainable, guestId } = req.body;
  if (!type || !productId) return res.status(400).json({ message: "type and productId are required" });

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
  await profile.save();
  res.json({ ok: true });
});

router.get("/profile", async (req, res) => {
  const userId = extractUserId(req);
  const guestId = req.query.guestId;
  const profile = await getOrCreate(userId, guestId);
  if (!profile) return res.status(400).json({ message: "userId or guestId required" });

  const eventCount = profile.events.length;
  res.json({
    mature: eventCount >= 5,
    eventCount,
    preferredBrands: profile.preferredBrands,
    preferredCategories: profile.preferredCategories,
    budgetRange: profile.budgetRange,
    sustainabilityAffinity: profile.sustainabilityAffinity,
    returnPatterns: profile.returnPatterns,
    returnedBrands: profile.returnedBrands,
    purchasedCount: profile.purchasedProductIds.length,
    stage: eventCount < 5 ? "seedling" : eventCount < 20 ? "growing" : "established",
  });
});

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

// ══════════════════════════════════════════════════════════════════════════════
// TRUSTLENS INTEGRATION (existing seller-trust)
// ══════════════════════════════════════════════════════════════════════════════

router.post("/seller-trust", async (req, res) => {
  const { productId, userReturns = 0 } = req.body || {};
  const allProducts = await getAllProducts();
  const product = allProducts.find(p => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const sellerName = product.soldBy || "Unknown Seller";
  const productStats = getProductStats(productId);
  const realRg = productStats.returnRate;
  const realRi = Math.min(1, productStats.reorderRate / 0.45);
  const company = getCompanyByName(sellerName);

  const { productScore, status, Rg, Rs, Kp, Ri, raw, returnPenalty } = computeProductScore(product, userReturns, { Rg: realRg, Ri: realRi });

  const reorderPct = Math.round(productStats.reorderRate * 100);
  const keepPct = Math.round(Kp * 100);
  const onTime = computeDeliveryRate(product);
  const sellerYear = product.sellerSince || "2020";
  const sellerAge = new Date().getFullYear() - parseInt(sellerYear);
  const estOrders = Math.round(sellerAge * 48000 + (parseFloat(product.soldByRating || 4) - 3) * 25000);
  const ordersLabel = estOrders >= 1_000_000 ? `${(estOrders / 1_000_000).toFixed(1)}M+` : `${Math.round(estOrders / 1000)}k+`;

  const signals = [
    Rs >= 0.65 && { key: "reviews", icon: "Star", headline: `${Math.round(Rs * 100)}% positive review score`, subtitle: Rs >= 0.80 ? "Buyers consistently praise this product's quality and accuracy" : "Reviews are broadly positive across verified purchases", howWeMeasure: `Score: Rs = ${Rs.toFixed(2)} (weight 50% of total).` },
    Kp >= 0.82 && { key: "keepRate", icon: "PackageOpen", headline: `${keepPct}% of buyers kept their purchase`, subtitle: Kp >= 0.93 ? "Buyers receive exactly what's described — very few returns" : "Well within normal return rates for this category", howWeMeasure: `Score: Kp = ${Kp.toFixed(2)} (weight 30% of total).` },
    Ri >= 0.70 && { key: "reorders", icon: "RefreshCw", headline: `${reorderPct}% of buyers reordered this product`, subtitle: Ri >= 0.85 ? "Strong repeat purchase signal — buyers keep coming back" : "Buyers return to purchase this product again", howWeMeasure: `Score: Ri = ${Ri.toFixed(2)} (weight 20% of total).` },
    onTime >= 90 && { key: "delivery", icon: "Truck", headline: `${onTime}% on-time delivery`, subtitle: "Orders consistently arrive by the promised date", howWeMeasure: `Fulfilment method: ${product.fulfillment || "Merchant"}.` },
    sellerAge >= 3 && { key: "tenure", icon: "Store", headline: `${sellerAge}-year seller · ${ordersLabel} orders fulfilled`, subtitle: "Established seller with a long track record on Amazon", howWeMeasure: "Based on seller registration date and estimated lifetime order volume." },
  ].filter(Boolean);

  res.json({
    productScore, status, sellerName, totalBuyers: productStats.totalBuyers, signals,
    productStats: { totalBuyers: productStats.totalBuyers, returnRate: productStats.returnRate, reorderRate: productStats.reorderRate, avgRating: productStats.avgRating },
    company: company ? { verified: company.verified, foundedYear: company.foundedYear, category: company.category, fulfillment: company.fulfillment, verificationNote: company.verificationNote || null } : null,
    formula: { Rs: parseFloat(Rs.toFixed(3)), Kp: parseFloat(Kp.toFixed(3)), Ri: parseFloat(Ri.toFixed(3)), Rg: parseFloat(Rg.toFixed(3)), weights: { Rs: 0.50, Kp: 0.30, Ri: 0.20 }, raw: parseFloat(raw.toFixed(4)), returnPenalty },
  });
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
