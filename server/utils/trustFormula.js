/**
 * TrustLens™ formula — v2
 *
 * Score = 0.50·Rs + 0.30·Kp + 0.20·Ri
 *
 *   Rs  Review Score    trustScore / 100            weight 0.50
 *   Kp  Keep Rate       1 − Rg  (buyers who kept)  weight 0.30
 *   Ri  Reorder Index   seller rating normalised    weight 0.20
 *
 * Rg (global return rate) is inferred from return-signal phrases
 * and suspicious review ratio across the seller's catalogue.
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

/** Rs — Review Score (0–1). Curated trustScore captures authenticity + quality. */
export function computeRs(product) {
  return (product.trustScore != null ? product.trustScore : 70) / 100;
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
 * Returns: { companyScore, status, Rg, Rs, Kp, Ri, raw, returnPenalty }
 */
export function computeCompanyScore(product, sellerProducts, userReturns = 0) {
  let  Rg = computeRg(sellerProducts);
  Rg = Math.min(0.60, Rg + userReturns * 0.03);

  const Rs = computeRs(product);
  const Kp = computeKp(Rg);
  const Ri = computeRi(product);

  const raw = 0.50 * Rs + 0.30 * Kp + 0.20 * Ri;

  const returnPenalty = Math.min(30, userReturns * 2);
  const companyScore  = Math.max(5, Math.min(98, Math.round(raw * 100) - returnPenalty));

  return { companyScore, status: scoreToStatus(companyScore), Rg, Rs, Kp, Ri, raw, returnPenalty };
}

/** VERIFIED ≥ 75 · TRUSTED 50–74 · no negative label below 50 */
export function scoreToStatus(score) {
  if (score >= 75) return "VERIFIED";
  if (score >= 50) return "TRUSTED";
  return "TRUSTED"; // never surface a negative label to buyers
}
