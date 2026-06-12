import { Router } from "express";
import { senseItems, products } from "../data/mockData.js";

const router = Router();

router.get("/predictions", (req, res) => {
  // Sort by daysOverdue descending (most overdue first)
  const sorted = [...senseItems].sort((a, b) => b.daysOverdue - a.daysOverdue);
  res.json({ predictions: sorted });
});

// Simple heuristic analyzer for a product's reviews to produce a trust score and human reasons.
router.post("/analyze", (req, res) => {
  const { productId } = req.body || {};
  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const reviews = product.reviews || [];

  // Heuristics
  const total = reviews.length || 0;
  const suspicious = reviews.filter((r) => r.suspicious).length;
  const unverified = reviews.filter((r) => !r.verified).length;
  const allCaps = reviews.filter((r) => /[A-Z\s]{20,}/.test(r.body)).length;

  // Very simple duplicate detection (exact body match)
  const bodyCounts = {};
  reviews.forEach((r) => { bodyCounts[r.body] = (bodyCounts[r.body] || 0) + 1; });
  const duplicates = Object.values(bodyCounts).filter((c) => c > 1).length;

  // Start from baseline and subtract penalties
  let score = 90;
  const reasons = [];

  if (total === 0) {
    reasons.push("No reviews to analyze — trust score is estimated from product metadata.");
    score = product.trustScore || 75;
  } else {
    const suspiciousRatio = suspicious / Math.max(1, total);
    score -= Math.round(suspiciousRatio * 60); // big penalty for suspicious flags
    if (suspicious > 0) reasons.push(`${suspicious} review(s) flagged by simple heuristics as suspicious.`);

    const dupRatio = duplicates / Math.max(1, total);
    score -= Math.round(dupRatio * 25);
    if (duplicates > 0) reasons.push(`${duplicates} duplicate review text group(s) detected.`);

    const capsRatio = allCaps / Math.max(1, total);
    score -= Math.round(capsRatio * 20);
    if (allCaps > 0) reasons.push(`${allCaps} review(s) with all-caps / spammy phrasing detected.`);

    const unverifiedRatio = unverified / Math.max(1, total);
    score -= Math.round(unverifiedRatio * 10);
    if (unverified > 0 && unverifiedRatio > 0.6) reasons.push(`High fraction (${Math.round(unverifiedRatio * 100)}%) of unverified reviews.`);

    // Clamp
    if (score < 5) score = 5;
    if (score > 98) score = 98;
  }

  // Friendly labels
  const label = score > 75 ? "Genuine" : score >= 50 ? "Mixed" : "Suspicious";

  res.json({ analysis: { trustScore: score, label, reasons, totalReviews: total, suspiciousCount: suspicious } });
});

export default router;
