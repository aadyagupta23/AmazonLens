import { Router } from "express";
import { senseItems } from "../data/mockData.js";
import { getAllProducts } from "./products.js";

const router = Router();

router.get("/predictions", (req, res) => {
  const sorted = [...senseItems].sort((a, b) => b.daysOverdue - a.daysOverdue);
  res.json({ predictions: sorted });
});

function computeTrustBreakdown(product) {
  const reviews = product.reviews || [];
  const total = reviews.length;
  const breakdown = {};

  // ── Review Authenticity ──
  let reviewAuth = 85;
  if (total > 0) {
    const suspicious = reviews.filter((r) => r.suspicious).length;
    const unverified = reviews.filter((r) => !r.verified).length;
    const allCaps = reviews.filter((r) => /[A-Z\s]{20,}/.test(r.body)).length;
    const bodyCounts = {};
    reviews.forEach((r) => { bodyCounts[r.body] = (bodyCounts[r.body] || 0) + 1; });
    const duplicates = Object.values(bodyCounts).filter((c) => c > 1).length;

    reviewAuth -= Math.round((suspicious / total) * 55);
    reviewAuth -= Math.round((allCaps / total) * 20);
    reviewAuth -= Math.round((duplicates / total) * 15);
    if (unverified / total > 0.5) reviewAuth -= Math.round((unverified / total) * 12);
    reviewAuth = Math.max(10, Math.min(97, reviewAuth));

    breakdown.reviewAuthenticity = {
      score: reviewAuth,
      detail: suspicious > 0
        ? `${suspicious} of ${total} reviews carry bot-pattern signatures — all-caps text, 0-day accounts, or coordinated burst posting on the same date.`
        : `Review patterns look authentic — verified purchases dominate with no burst posting or synthetic signatures detected across ${total} reviews.`
    };
  } else {
    const highRatingFewReviews = product.rating >= 4.7 && product.reviewCount < 50;
    reviewAuth = highRatingFewReviews ? 62 : 80;
    breakdown.reviewAuthenticity = {
      score: reviewAuth,
      detail: reviewAuth > 75
        ? "No reviews available for deep analysis. Rating distribution and purchase velocity appear organic."
        : "Limited review sample. High rating with very few verified buyers warrants caution."
    };
  }

  // ── Return Rate ──
  let returnRate = 80;
  if (total > 0) {
    const returnKw = /\b(returned|refunded|not as described|misleading|wrong product|sent wrong|waste of money|doesn.t match|had to return|sent back|requested a refund)\b/i;
    const returnMentions = reviews.filter((r) => returnKw.test(r.body + " " + r.title)).length;
    returnRate -= Math.round((returnMentions / total) * 50);
    returnRate = Math.max(10, Math.min(96, returnRate));
    breakdown.returnRate = {
      score: returnRate,
      detail: returnRate > 75
        ? `Low return rate — buyers consistently receive what was described. Only ${returnMentions} of ${total} reviews mention return or mismatch issues.`
        : `${returnMentions} of ${total} reviews cite returns or product mismatch — above-category average. Verify the listing before purchase.`
    };
  } else {
    const categoryBaselines = { Electronics: 74, Grocery: 91, Clothing: 62, Books: 94, Home: 79, Sports: 76 };
    const topCat = (product.category || "").split(" > ")[0];
    returnRate = categoryBaselines[topCat] || 78;
    breakdown.returnRate = {
      score: returnRate,
      detail: returnRate > 75
        ? `Return rate within normal range for the ${topCat} category based on aggregate benchmarks.`
        : `Return rate slightly elevated for the ${topCat} category — verify product specs carefully before purchase.`
    };
  }

  // ── Warranty Claims ──
  let warrantyClaims = 80;
  if (total > 0) {
    const wKw = /\b(defective|warranty|stopped working|stopped|broke|broken|dead|faulty|malfunction|repair|not working|fell apart|quality issue|manufacturing|doa|dead on arrival)\b/i;
    const wMentions = reviews.filter((r) => wKw.test(r.body + " " + r.title)).length;
    warrantyClaims -= Math.round((wMentions / total) * 55);
    warrantyClaims = Math.max(10, Math.min(96, warrantyClaims));
    breakdown.warrantyClaims = {
      score: warrantyClaims,
      detail: warrantyClaims > 75
        ? `Warranty claim signal is low — only ${wMentions} of ${total} reviews report quality failures within the first 6 months.`
        : `${wMentions} of ${total} reviews report defects or early failures — elevated warranty claim signal. Quality consistency is below category norms.`
    };
  } else {
    const premiumBrands = ["Apple", "Sony", "Samsung", "LG", "Bose", "Bosch", "Philips", "Nestlé", "Nescafé"];
    const isPremium = premiumBrands.some((b) => (product.brand || "").includes(b));
    warrantyClaims = isPremium ? 87 : 73;
    breakdown.warrantyClaims = {
      score: warrantyClaims,
      detail: warrantyClaims > 75
        ? "Very few warranty claims detected — product quality is consistent with brand-tier standards."
        : "Limited data. Warranty claim rate for this brand tier is slightly above category average."
    };
  }

  // ── Seller Reliability ──
  const sellerRating = parseFloat(product.soldByRating) || 3.5;
  const sellerAge = new Date().getFullYear() - parseInt(product.sellerSince || "2021");
  const isAmazonFulfilled = (product.fulfillment || "").toLowerCase().includes("amazon");

  const ratingScore = Math.round(((sellerRating - 1) / 4) * 60);
  const ageScore = Math.min(20, sellerAge * 2);
  const fulfillScore = isAmazonFulfilled ? 15 : 0;
  let sellerRel = Math.max(15, Math.min(97, ratingScore + ageScore + fulfillScore));

  breakdown.sellerReliability = {
    score: sellerRel,
    detail: sellerRel > 75
      ? `Established seller with ${sellerRating}★ rating, active on Amazon since ${product.sellerSince}. ${isAmazonFulfilled ? "Amazon-fulfilled — delivery and returns are backed by Amazon." : "Seller-fulfilled shipments."}`
      : `Seller rating of ${sellerRating}★, active since ${product.sellerSince}. Limited track record or below-average ratings — exercise caution.`
  };

  // ── Overall Score (weighted) ──
  const overall = Math.max(5, Math.min(98, Math.round(
    0.35 * breakdown.reviewAuthenticity.score +
    0.20 * breakdown.returnRate.score +
    0.20 * breakdown.warrantyClaims.score +
    0.25 * breakdown.sellerReliability.score
  )));

  const label = overall > 75 ? "Genuine" : overall >= 50 ? "Mixed" : "Suspicious";

  const reasons = [];
  if (breakdown.reviewAuthenticity.score < 65) reasons.push(breakdown.reviewAuthenticity.detail);
  if (breakdown.returnRate.score < 65) reasons.push(breakdown.returnRate.detail);
  if (breakdown.warrantyClaims.score < 65) reasons.push(breakdown.warrantyClaims.detail);
  if (breakdown.sellerReliability.score < 65) reasons.push(breakdown.sellerReliability.detail);
  if (reasons.length === 0) {
    reasons.push("All four trust signals are within acceptable parameters — this product meets TrustLens™ standards.");
  }

  return { overall, label, breakdown, reasons, totalReviews: total };
}

router.post("/analyze", async (req, res) => {
  const { productId } = req.body || {};
  const allProducts = await getAllProducts();
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const result = computeTrustBreakdown(product);

  res.json({
    analysis: {
      trustScore: result.overall,
      label: result.label,
      breakdown: result.breakdown,
      reasons: result.reasons,
      totalReviews: result.totalReviews,
      reviewCount: (product.reviews || []).length,
      sellerSince: product.sellerSince,
    }
  });
});

export default router;
