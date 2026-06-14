/**
 * Amazon Lens DNA — API Routes
 *
 * POST /api/dna/event          — record a behavioural event
 * GET  /api/dna/profile        — return the caller's DNA profile
 * GET  /api/dna/risk/:productId — return risk score for a product
 */

import { Router } from "express";
import jwt from "jsonwebtoken";
import DnaProfile from "../models/DnaProfile.js";
import { getProductStats } from "../data/customers.js";

const router = Router();

// ─── Auth helper (soft — never blocks the request) ───────────────────────────
function extractUserId(req) {
  try {
    const header = req.headers.authorization || "";
    const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || null;
  } catch {
    return null;
  }
}

// ─── Find or create profile ───────────────────────────────────────────────────
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

// ─── Recompute derived fields from raw event log ──────────────────────────────
function recompute(profile) {
  const events = profile.events;

  // ── Preferred brands (weighted: purchase=3, cart=2, view=1, return=-2) ──
  const brandScores = {};
  const catScores   = {};
  const purchasePrices = [];

  // Return tracking
  const returnsByCategory = {};
  const purchasesByCategory = {};

  for (const e of events) {
    const w =
      e.type === "purchase"  ?  3 :
      e.type === "cart_add"  ?  2 :
      e.type === "view"      ?  1 :
      /* return */              -2;

    if (e.brand) {
      brandScores[e.brand] = (brandScores[e.brand] || 0) + w;
    }
    if (e.category) {
      catScores[e.category] = (catScores[e.category] || 0) + w;
    }
    if (e.type === "purchase" && e.price > 0) {
      purchasePrices.push(e.price);
      purchasesByCategory[e.category] = (purchasesByCategory[e.category] || 0) + 1;
    }
    if (e.type === "return" && e.category) {
      returnsByCategory[e.category] = (returnsByCategory[e.category] || 0) + 1;
    }
  }

  // Sort and cap
  profile.preferredBrands = Object.entries(brandScores)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([brand, score]) => ({ brand, score }));

  profile.preferredCategories = Object.entries(catScores)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, score]) => ({ category, score }));

  // Budget range from purchases
  if (purchasePrices.length > 0) {
    profile.budgetRange = {
      min: Math.min(...purchasePrices),
      max: Math.max(...purchasePrices),
      avg: Math.round(purchasePrices.reduce((s, p) => s + p, 0) / purchasePrices.length),
    };
  }

  // Sustainability affinity — share of eco purchases
  const purchases   = events.filter((e) => e.type === "purchase");
  const ecoPurchases = purchases.filter((e) => e.sustainable);
  profile.sustainabilityAffinity =
    purchases.length > 0 ? parseFloat((ecoPurchases.length / purchases.length).toFixed(2)) : 0;

  // Return patterns per category
  profile.returnPatterns = Object.entries(returnsByCategory).map(([category, returnCount]) => {
    const purchaseCount = purchasesByCategory[category] || 1;
    return {
      category,
      returnCount,
      purchaseCount,
      returnRate: parseFloat((returnCount / purchaseCount).toFixed(2)),
    };
  });

  // Returned product IDs and brands
  const returnEvents = events.filter((e) => e.type === "return");
  profile.returnedProductIds = [...new Set(returnEvents.map((e) => e.productId))];
  profile.returnedBrands     = [...new Set(returnEvents.map((e) => e.brand).filter(Boolean))];
  profile.purchasedProductIds = [
    ...new Set(events.filter((e) => e.type === "purchase").map((e) => e.productId)),
  ];

  // Cap events at 200
  if (profile.events.length > 200) {
    profile.events = profile.events.slice(-200);
  }
}

// ─── POST /api/dna/event ─────────────────────────────────────────────────────
router.post("/event", async (req, res) => {
  const { type, productId, category, brand, price, sustainable, guestId } = req.body;

  if (!type || !productId) {
    return res.status(400).json({ message: "type and productId are required" });
  }

  const userId  = extractUserId(req);
  const profile = await getOrCreate(userId, guestId);
  if (!profile) return res.status(400).json({ message: "userId or guestId required" });

  // Deduplicate view events within a 10-minute window
  if (type === "view") {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentView = profile.events.find(
      (e) => e.type === "view" && e.productId === productId && new Date(e.at) > tenMinAgo
    );
    if (recentView) return res.json({ skipped: true });
  }

  profile.events.push({ type, productId, category: category || "", brand: brand || "", price: price || 0, sustainable: !!sustainable });
  recompute(profile);
  await profile.save();

  res.json({ ok: true });
});

// ─── GET /api/dna/profile ────────────────────────────────────────────────────
router.get("/profile", async (req, res) => {
  const userId  = extractUserId(req);
  const guestId = req.query.guestId;
  const profile = await getOrCreate(userId, guestId);
  if (!profile) return res.status(400).json({ message: "userId or guestId required" });

  const eventCount = profile.events.length;
  const mature     = eventCount >= 5; // DNA needs at least 5 events to be meaningful

  res.json({
    mature,
    eventCount,
    preferredBrands:      profile.preferredBrands,
    preferredCategories:  profile.preferredCategories,
    budgetRange:          profile.budgetRange,
    sustainabilityAffinity: profile.sustainabilityAffinity,
    returnPatterns:       profile.returnPatterns,
    returnedBrands:       profile.returnedBrands,
    purchasedCount:       profile.purchasedProductIds.length,
    // Evolution label
    stage: eventCount < 5 ? "seedling" : eventCount < 20 ? "growing" : "established",
  });
});

// ─── GET /api/dna/risk/:productId ────────────────────────────────────────────
router.get("/risk/:productId", async (req, res) => {
  const { productId } = req.params;
  const userId  = extractUserId(req);
  const guestId = req.query.guestId;
  const profile = await getOrCreate(userId, guestId);

  // Pull product metadata from query params (sent by frontend)
  const category  = req.query.category  || "";
  const brand     = req.query.brand     || "";
  const price     = parseFloat(req.query.price) || 0;

  const warnings = [];
  let riskScore  = 0; // 0 = no risk, 100 = high risk

  if (profile && profile.events.length >= 3) {
    // ── Rule 1: User already returned this brand ──────────────────────────
    if (brand && profile.returnedBrands.includes(brand)) {
      warnings.push({
        type: "brand_return",
        severity: "high",
        message: `You've returned a ${brand} product before.`,
        detail: "Products from brands you've returned have a higher chance of disappointing you again.",
      });
      riskScore += 35;
    }

    // ── Rule 2: High personal return rate in this category ────────────────
    if (category) {
      const pattern = profile.returnPatterns.find(
        (p) => category.toLowerCase().includes(p.category.toLowerCase()) ||
               p.category.toLowerCase().includes(category.toLowerCase())
      );
      if (pattern && pattern.returnRate > 0.3) {
        warnings.push({
          type: "category_pattern",
          severity: "medium",
          message: `You return ${Math.round(pattern.returnRate * 100)}% of ${pattern.category} purchases.`,
          detail: "Your personal history suggests this category tends not to meet your expectations.",
        });
        riskScore += 25;
      }
    }

    // ── Rule 3: Product price significantly above your usual spend ────────
    if (price > 0 && profile.budgetRange.avg > 0) {
      const ratio = price / profile.budgetRange.avg;
      if (ratio > 2.5) {
        warnings.push({
          type: "price_stretch",
          severity: "low",
          message: `This is ${Math.round(ratio)}× your average spend (₹${profile.budgetRange.avg.toLocaleString("en-IN")} avg).`,
          detail: "Big price stretches correlate with buyer's remorse — make sure this fits your needs.",
        });
        riskScore += 15;
      }
    }

    // ── Rule 4: Already bought this exact product ─────────────────────────
    if (profile.purchasedProductIds.includes(productId)) {
      warnings.push({
        type: "already_owned",
        severity: "info",
        message: "You've already purchased this product.",
        detail: "You own this. Check your orders page — you might not need another.",
      });
      // Not a risk, just informational — no score bump
    }
  }

  // ── Rule 5: Community return rate from customers.js data ─────────────────
  const stats = getProductStats(productId);
  if (stats.returnRate > 0.2 && stats.totalBuyers >= 5) {
    warnings.push({
      type: "community_returns",
      severity: stats.returnRate > 0.35 ? "high" : "medium",
      message: `${Math.round(stats.returnRate * 100)}% of buyers returned this product.`,
      detail: `Based on ${stats.totalBuyers} buyers in our database. Common reasons include quality and description mismatch.`,
    });
    riskScore += stats.returnRate > 0.35 ? 30 : 15;
  }

  riskScore = Math.min(100, riskScore);

  res.json({
    productId,
    riskScore,
    riskLabel: riskScore >= 60 ? "High Risk" : riskScore >= 30 ? "Moderate Risk" : riskScore > 0 ? "Low Risk" : "No Risk",
    warnings,
    hasDna: !!(profile && profile.events.length >= 3),
  });
});

export default router;
