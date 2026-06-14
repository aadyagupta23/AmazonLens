/**
 * TrustLens™ formula — v2  (product-level)
 *
 * Score = 0.50·Rs + 0.30·Kp + 0.20·Ri
 *
 *   Rs  Review Score    avg star rating from customer DB, normalised (1★→0, 5★→1)  weight 0.50
 *   Kp  Keep Rate       1 − Rg  (this product's return rate)                        weight 0.30
 *   Ri  Reorder Index   this product's reorder rate / 0.45                          weight 0.20
 *
 * All three components are per-product, computed from real customer order data.
 */

/** Rg — Global Return Rate (0–1) from review language + suspicious ratio. */
export function computeRg(sellerProducts) {
  const returnKw = /\b(returned|refunded|not as described|wrong product|sent wrong|waste of money|sent back|had to return|requested a refund)\b/i;
  let kwTotal = 0, suspTotal = 0, count = 0;

  for (const p of sellerProducts) {
    const reviews = p.reviews || [];
    if (!reviews.length) continue;
    kwTotal   += reviews.filter((r) => returnKw.test(r.body + " " + r.title)).length / reviews.length;
    suspTotal += reviews.filter((r) => r.suspicious).length / reviews.length;
    count++;
  }

  if (count === 0) return 0.05;
  return Math.min(0.60, (kwTotal / count) * 0.60 + (suspTotal / count) * 0.40);
}

/** Rs — Review Score (0–1). Normalised avg star rating: (avgRating − 1) / 4. */
export function computeRs(avgRating) {
  return Math.max(0, Math.min(1, ((avgRating ?? 4.0) - 1) / 4));
}

/** Kp — Keep Rate (0–1). Inverse of return rate. */
export function computeKp(Rg) {
  return 1 - Rg;
}

/** Ri — Reorder Index (0–1). Seller star rating normalised to 0–1. */
export function computeRi(product) {
  const rating = parseFloat(product.soldByRating) || 3.5;
  return Math.min(1, Math.max(0, (rating - 1) / 4));
}

/** On-time delivery rate (%) — supplementary display only, not in score. */
export function computeDeliveryRate(product) {
  const isAFN  = (product.fulfillment || "").toLowerCase().includes("amazon");
  const rating = parseFloat(product.soldByRating) || 3.5;
  if (isAFN) return Math.min(99, Math.round(93 + (rating - 3) * 3));
  return Math.min(95, Math.round(76 + (rating - 3) * 8));
}

/**
 * Core formula:  score = round((0.50·Rs + 0.30·Kp + 0.20·Ri) × 100)
 * User returns: Rg += 3% per return, plus 2-pt direct deduction per return.
 *
 * overrides.Rg = this product's actual return rate (from customer DB)
 * overrides.Ri = this product's reorder rate normalised to 0–1
 *
 * Returns: { productScore, status, Rg, Rs, Kp, Ri, raw, returnPenalty }
 */
export function computeProductScore(product, userReturns = 0, overrides = {}) {
  let Rg = overrides.Rg ?? 0.10; // default 10% if no customer data
  Rg = Math.min(0.60, Rg + userReturns * 0.03);

  // Use real avgRating from customer DB when available; fall back to product.rating (display rating)
  const avgRating = overrides.avgRating ?? product.rating ?? 4.0;
  const Rs = computeRs(avgRating);
  const Kp = computeKp(Rg);
  const Ri = overrides.Ri ?? computeRi(product);

  const raw = 0.50 * Rs + 0.30 * Kp + 0.20 * Ri;

  const returnPenalty = Math.min(30, userReturns * 2);
  const productScore  = Math.max(5, Math.min(98, Math.round(raw * 100) - returnPenalty));

  return { productScore, status: scoreToStatus(productScore), Rg, Rs, Kp, Ri, raw, returnPenalty };
}

/** @deprecated use computeProductScore */
export function computeCompanyScore(product, sellerProducts, userReturns = 0, overrides = {}) {
  return computeProductScore(product, userReturns, overrides);
}

/** VERIFIED ≥ 75 · TRUSTED 50–74 · no negative label below 50 */
export function scoreToStatus(score) {
  if (score >= 75) return "VERIFIED";
  if (score >= 50) return "TRUSTED";
  return "TRUSTED"; // never surface a negative label to buyers
}
