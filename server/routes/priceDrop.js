/**
 * AmazonLens – Price Drop Prediction API
 * Analyzes 12-month price history to predict future price movement.
 */

import { Router } from "express";
import { products } from "../data/mockData.js";

const router = Router();

/**
 * Heuristic price prediction engine.
 * Analyzes trends, volatility, seasonality, and current position.
 */
function predictPriceDrop(product) {
  const history = product.priceHistory || [];
  if (history.length < 3) {
    return { prediction: "unknown", confidence: 0, reason: "Insufficient price history." };
  }

  const current = product.price;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const avg = Math.round(history.reduce((s, p) => s + p, 0) / history.length);
  const range = max - min;

  // Volatility: how much the price swings relative to average
  const volatility = range / avg;

  // Trend: compare recent 3 months vs older months
  const recent3 = history.slice(-3);
  const older = history.slice(0, -3);
  const recentAvg = recent3.reduce((s, p) => s + p, 0) / recent3.length;
  const olderAvg = older.reduce((s, p) => s + p, 0) / older.length;
  const trendDirection = recentAvg < olderAvg ? "declining" : recentAvg > olderAvg ? "rising" : "stable";

  // Position: where is current price relative to historical range
  const positionPct = range > 0 ? ((current - min) / range) * 100 : 50;

  // Spike analysis
  const spikeMonths = product.spikePriceMonths || [];
  const isFakeDiscount = product.isFakeDiscount || false;

  // Days until predicted drop (mock seasonal logic)
  const now = new Date();
  const month = now.getMonth();
  // Sale seasons: Jan (Republic Day), Jul (Prime Day), Oct (Great Indian Festival), Nov (Black Friday)
  const saleMonths = [0, 6, 9, 10];
  let nextSaleMonth = saleMonths.find((m) => m > month);
  if (nextSaleMonth === undefined) nextSaleMonth = saleMonths[0] + 12;
  const daysUntilSale = Math.round(((nextSaleMonth - month) * 30.5));

  // Build prediction
  let prediction, confidence, reason, expectedDrop, recommendation, daysToWait;

  if (positionPct <= 15) {
    // Near historical low
    prediction = "stable";
    confidence = 82;
    reason = `Current price is near the 12-month low (₹${min.toLocaleString('en-IN')}). Unlikely to drop further.`;
    expectedDrop = 0;
    recommendation = "buy";
    daysToWait = 0;
  } else if (positionPct >= 70 && trendDirection === "declining") {
    // High but declining
    const dropPct = Math.round((recentAvg - min) / recentAvg * 100);
    prediction = "likely_drop";
    confidence = 75;
    reason = `Price is declining from a peak. Historical low is ${dropPct}% below recent average. Next major sale in ~${daysUntilSale} days.`;
    expectedDrop = Math.round(current * dropPct / 100);
    recommendation = "wait";
    daysToWait = Math.min(daysUntilSale, 30);
  } else if (isFakeDiscount && spikeMonths.length >= 3) {
    // Fake discount pattern
    prediction = "likely_drop";
    confidence = 88;
    reason = `This product has a fake discount pattern — MRP is inflated ${spikeMonths.length} months/year. The "sale" price is actually the normal price. Wait for a genuine deal.`;
    expectedDrop = Math.round(current * 0.15);
    recommendation = "wait";
    daysToWait = daysUntilSale;
  } else if (volatility > 0.3 && trendDirection !== "rising") {
    // Highly volatile, not rising
    const dropPct = Math.round(((current - min) / current) * 100);
    prediction = "possible_drop";
    confidence = 60;
    reason = `High price volatility (${Math.round(volatility * 100)}%). Price has ranged from ₹${min.toLocaleString('en-IN')} to ₹${max.toLocaleString('en-IN')}. A drop of ${dropPct}% is plausible during the next sale event.`;
    expectedDrop = Math.round(current * dropPct / 100);
    recommendation = "wait";
    daysToWait = Math.min(daysUntilSale, 21);
  } else if (trendDirection === "rising") {
    prediction = "rising";
    confidence = 70;
    reason = `Price trend is upward over the last 3 months. Supply constraints or demand spikes may push it higher.`;
    expectedDrop = 0;
    recommendation = "buy";
    daysToWait = 0;
  } else {
    prediction = "stable";
    confidence = 65;
    reason = `Price has been relatively stable. No strong signals for a near-term drop.`;
    expectedDrop = 0;
    recommendation = "buy";
    daysToWait = 0;
  }

  return {
    prediction,
    confidence,
    reason,
    recommendation,
    expectedDrop,
    daysToWait,
    stats: {
      current,
      min,
      max,
      avg,
      volatility: Math.round(volatility * 100),
      trend: trendDirection,
      positionPct: Math.round(positionPct),
      nextSaleIn: daysUntilSale,
    },
  };
}

// GET /api/price-drop/:productId
router.get("/:productId", (req, res) => {
  const product = products.find((p) => p.id === req.params.productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const prediction = predictPriceDrop(product);
  res.json(prediction);
});

export default router;
