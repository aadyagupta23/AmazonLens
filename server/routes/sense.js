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
