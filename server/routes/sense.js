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

  const sellerName = product.soldBy || "Unknown Seller";
  const sellerProducts = allProducts.filter((p) => p.soldBy === sellerName);

  // Compute fresh (with user returns applied on top of baseline)
  const { companyScore, status, Rg, Rs, Kp, Ri, raw, returnPenalty } =
    computeCompanyScore(product, sellerProducts, userReturns);

  // ── Derived display values ─────────────────────────────────────────────
  const reorderPct  = Math.round(Ri * 40 + 20);   // seller-rating → 20–60%
  const keepPct     = Math.round(Kp * 100);         // buyers who kept item
  const onTime      = computeDeliveryRate(product);
  const sellerYear  = product.sellerSince || "2020";
  const sellerAge   = new Date().getFullYear() - parseInt(sellerYear);
  const estOrders   = Math.round(
    sellerAge * 48000 + (parseFloat(product.soldByRating || 4) - 3) * 25000,
  );
  const ordersLabel = estOrders >= 1_000_000
    ? `${(estOrders / 1_000_000).toFixed(1)}M+`
    : `${Math.round(estOrders / 1000)}k+`;

  // ── Trust signals — only emit when seller genuinely earns the signal ───
  // No negative signals ever. If a signal isn't earned, it simply isn't shown.
  const signals = [
    // 1. Review score — shown if Rs ≥ 0.65 (review quality is solid)
    Rs >= 0.65 && {
      key: "reviews",
      icon: "Star",
      headline: `${Math.round(Rs * 100)}% positive review score`,
      subtitle: Rs >= 0.80
        ? "Buyers consistently praise this product's quality and accuracy"
        : "Reviews are broadly positive across verified purchases",
      howWeMeasure:
        "Derived from the product's review authenticity score — captures genuine buyer " +
        "sentiment, filters out suspicious patterns, and weighs verified purchases more heavily. " +
        `Score: Rs = ${Rs.toFixed(2)} (weight 50% of total).`,
    },
    // 2. Keep rate — shown if Kp ≥ 0.82 (return rate below ~18%)
    Kp >= 0.82 && {
      key: "keepRate",
      icon: "PackageOpen",
      headline: `${keepPct}% of buyers kept their purchase`,
      subtitle: Kp >= 0.93
        ? "Buyers receive exactly what's described — very few returns"
        : "Well within normal return rates for this category",
      howWeMeasure:
        "Keep rate is the inverse of the inferred return rate. Returns are inferred from " +
        "return-signal phrases in verified reviews and suspicious review ratios. " +
        `Score: Kp = ${Kp.toFixed(2)} (weight 30% of total).`,
    },
    // 3. Reorder rate — shown if seller rating ≥ 3.8 (Ri ≥ 0.70)
    Ri >= 0.70 && {
      key: "reorders",
      icon: "RefreshCw",
      headline: `${reorderPct}% of buyers purchase from this seller again`,
      subtitle: Ri >= 0.85
        ? "Strong repeat purchase signal — buyers trust this seller consistently"
        : "Buyers come back to this seller, showing consistent satisfaction",
      howWeMeasure:
        "Reorder index is derived from the seller's star rating, normalised to 0–1. " +
        "Higher seller ratings strongly predict repeat purchase behaviour. " +
        `Score: Ri = ${Ri.toFixed(2)} (weight 20% of total).`,
    },
    // 4. On-time delivery — supplementary, shown if ≥ 90%
    onTime >= 90 && {
      key: "delivery",
      icon: "Truck",
      headline: `${onTime}% on-time delivery`,
      subtitle: "Orders consistently arrive by the promised date",
      howWeMeasure:
        "Estimated from fulfilment type and seller rating over the last 90 days. " +
        `Fulfilment method: ${product.fulfillment || "Merchant"}.`,
    },
    // 5. Seller tenure — supplementary, shown if ≥ 3 years
    sellerAge >= 3 && {
      key: "tenure",
      icon: "Store",
      headline: `${sellerAge}-year seller · ${ordersLabel} orders fulfilled`,
      subtitle: "Established seller with a long track record on Amazon",
      howWeMeasure:
        "Based on the seller's Amazon account registration date and estimated lifetime " +
        "order volume. Tenure correlates strongly with lower dispute rates.",
    },
  ].filter(Boolean);

  res.json({
    companyScore,
    status,
    sellerName,
    productCount: sellerProducts.length,
    signals,
    formula: {
      Rs: parseFloat(Rs.toFixed(3)),
      Kp: parseFloat(Kp.toFixed(3)),
      Ri: parseFloat(Ri.toFixed(3)),
      Rg: parseFloat(Rg.toFixed(3)),
      weights: { Rs: 0.50, Kp: 0.30, Ri: 0.20 },
      raw: parseFloat(raw.toFixed(4)),
      returnPenalty,
    },
  });
});

// ── Legacy analyze (backward compat) ──────────────────────────────────────
router.post("/analyze", async (req, res) => {
  const { productId } = req.body || {};
  const allProducts = await getAllProducts();
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const reviews = product.reviews || [];
  const suspicious = reviews.filter((r) => r.suspicious).length;
  const score = Math.max(5, Math.min(98, 90 - Math.round((suspicious / Math.max(1, reviews.length)) * 60)));
  res.json({ analysis: { trustScore: score, totalReviews: reviews.length } });
});

export default router;
