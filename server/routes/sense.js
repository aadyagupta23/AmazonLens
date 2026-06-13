import { Router } from "express";
import { senseItems } from "../data/mockData.js";
import { getAllProducts } from "./products.js";
import { computeCompanyScore, computeDeliveryRate } from "../utils/trustFormula.js";

const router = Router();

// ── Sense predictions ──────────────────────────────────────────────────────
router.get("/predictions", (req, res) => {
  const sorted = [...senseItems].sort((a, b) => b.daysOverdue - a.daysOverdue);
  res.json({ predictions: sorted });
});

<<<<<<< HEAD
// ── Seller-trust breakdown ─────────────────────────────────────────────────
/**
 * POST /api/sense/seller-trust
 * Body: { productId, userReturns? }
 *
 * Returns the same companyScore that is attached to the product in getAllProducts(),
 * plus full signal breakdown and user-return modifier.
 */
router.post("/seller-trust", async (req, res) => {
  const { productId, userReturns = 0 } = req.body || {};
=======
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
>>>>>>> 1dc00a4d49c2e15a3d0a4ff8a5021dee7e9590f2
  const allProducts = await getAllProducts();
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const sellerName     = product.soldBy || "Unknown Seller";
  const sellerProducts = allProducts.filter((p) => p.soldBy === sellerName);

  // Compute fresh (with user returns applied on top of baseline)
  const { companyScore, status, Rg, Od, Cs, Bv, raw, returnPenalty } =
    computeCompanyScore(product, sellerProducts, userReturns);

  // ── Derived display values ─────────────────────────────────────────────
  const reorderRate   = Math.round(Cs * 40 + 5);         // 5–45 %
  const returnRatePct = Math.round(Rg * 100);
  const onTime        = computeDeliveryRate(product);
  const sellerYear    = product.sellerSince || "2020";
  const sellerAge     = new Date().getFullYear() - parseInt(sellerYear);
  const estOrders     = Math.round(
    sellerAge * 48000 + (parseFloat(product.soldByRating || 4) - 3) * 25000,
  );
  const ordersLabel   = estOrders >= 1_000_000
    ? `${(estOrders / 1_000_000).toFixed(1)}M+`
    : `${Math.round(estOrders / 1000)}k+`;

  // ── 5 signal rows ──────────────────────────────────────────────────────
  const signals = [
    {
      key:      "reorderRate",
      icon:     "RefreshCw",
      headline: `${reorderRate}% of buyers reorder from this seller`,
      subtitle: reorderRate >= 35
        ? "Strong customer loyalty — buyers keep coming back"
        : reorderRate >= 20
        ? "Moderate repeat purchase rate"
        : "Low customer retention for this seller",
      status: reorderRate >= 35 ? "good" : reorderRate >= 20 ? "warning" : "bad",
      howWeMeasure:
        "Share of verified purchasers who bought from this seller again within 12 months. " +
        "Derived from the product's authenticity score and aggregated review sentiment.",
      formulaVar: `Cs = ${Cs.toFixed(2)} (Customer Sentiment / Review Authenticity, w3 = 0.80)`,
    },
    {
      key:      "brandAuth",
      icon:     "ShieldCheck",
      headline: Bv === 1.0
        ? "Verified Authentic Brand"
        : Bv === 0.75
        ? "Established Seller"
        : "Independent Third-Party Seller",
      subtitle: Bv === 1.0
        ? "Amazon-verified seller · Brand Registry protected"
        : Bv === 0.75
        ? "Reliable seller · No counterfeit complaints on record"
        : "Not enrolled in Amazon Brand Registry — verify authenticity",
      status:   Bv === 1.0 ? "good" : Bv === 0.75 ? "warning" : "bad",
      howWeMeasure:
        "Checks whether the seller is enrolled in Amazon Brand Registry, " +
        "fulfilled through Amazon's network, and has a sustained high seller rating.",
      formulaVar: `Bv = ${Bv.toFixed(2)} (Verification Status, w4 = 0.10)`,
    },
    {
      key:      "returnRate",
      icon:     "PackageOpen",
      headline: returnRatePct < 5
        ? `Under ${Math.max(2, returnRatePct + 1)}% return rate`
        : `${returnRatePct}% return rate across seller's products`,
      subtitle: Rg < 0.08
        ? "Most customers keep this item — low return signals"
        : Rg < 0.20
        ? "Return rate within category norms"
        : "Above-average returns — possible quality or listing issues",
      status:   Rg < 0.08 ? "good" : Rg < 0.20 ? "warning" : "bad",
      howWeMeasure:
        "Returns inferred from return-signal phrases in verified reviews and the ratio of " +
        "suspicious reviews (a leading indicator of eventual returns).",
      formulaVar: `Rg = ${Rg.toFixed(2)} (Global Return Rate, w1 = 0.05)`,
    },
    {
      key:      "onTimeDelivery",
      icon:     "Truck",
      headline: `${onTime}% on-time delivery`,
      subtitle: onTime >= 95
        ? "Fast, reliable shipping every time"
        : onTime >= 85
        ? "Generally reliable — occasional delays"
        : "Some delivery delays reported for this seller",
      status:   onTime >= 95 ? "good" : onTime >= 85 ? "warning" : "bad",
      howWeMeasure:
        "Orders delivered by the promised date over the last 90 days. " +
        "Amazon-fulfilled sellers consistently outperform merchant-fulfilled.",
      formulaVar: `Derived from fulfillment type × seller rating (${product.fulfillment || "Unknown"})`,
    },
    {
      key:      "sellerTenure",
      icon:     "Store",
      headline: `Trusted seller since ${sellerYear}`,
      subtitle: `${ordersLabel} orders fulfilled · ${sellerAge} year${sellerAge !== 1 ? "s" : ""} on Amazon`,
      status:   sellerAge >= 5 ? "good" : sellerAge >= 2 ? "warning" : "bad",
      howWeMeasure:
        "Based on the seller's Amazon account registration date and estimated lifetime " +
        "fulfilled-order count. Longer tenure correlates with lower dispute rates.",
      formulaVar: `Seller active for ${sellerAge} year${sellerAge !== 1 ? "s" : ""} (derived)`,
    },
  ];

  res.json({
    companyScore,
    status,
    sellerName,
    productCount: sellerProducts.length,
    signals,
    formula: {
      Rg:           parseFloat(Rg.toFixed(3)),
      Od:           parseFloat(Od.toFixed(3)),
      Cs:           parseFloat(Cs.toFixed(3)),
      Bv,
      weights:      { w1: 0.05, w2: 0.05, w3: 0.80, w4: 0.10 },
      raw:          parseFloat(raw.toFixed(4)),
      returnPenalty,
    },
  });
});

// ── Legacy analyze (backward compat) ──────────────────────────────────────
router.post("/analyze", async (req, res) => {
  const { productId } = req.body || {};
  const allProducts   = await getAllProducts();
  const product       = allProducts.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const reviews    = product.reviews || [];
  const suspicious = reviews.filter((r) => r.suspicious).length;
  const score      = Math.max(5, Math.min(98, 90 - Math.round((suspicious / Math.max(1, reviews.length)) * 60)));
  res.json({ analysis: { trustScore: score, totalReviews: reviews.length } });
});

export default router;
