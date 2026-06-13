/**
 * Shared trust-formula helpers used by both products.js (batch scoring)
 * and sense.js (detailed per-product breakdown with signals).
 */

/** Rg — Global Return Rate (0–1). Return keywords + suspicious review ratio. */
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

/** Od — Order Defect Rate (0–1). Defect keywords + suspicious review ratio. */
export function computeOd(sellerProducts) {
  const defectKw = /\b(defective|broken|warranty|stopped working|dead|faulty|malfunction|dead on arrival|doa|not working)\b/i;
  let total = 0, count = 0;

  for (const p of sellerProducts) {
    const reviews = p.reviews || [];
    if (!reviews.length) continue;
    const susp    = reviews.filter((r) => r.suspicious).length;
    const defects = reviews.filter((r) => defectKw.test(r.body + " " + r.title)).length;
    total += (susp * 0.6 + defects * 0.4) / reviews.length;
    count++;
  }

  return count === 0 ? 0.03 : Math.min(0.60, total / count);
}

/**
 * Cs — Customer Sentiment Index (0–1).
 * Uses the curated static trustScore (review authenticity + product quality).
 * Star ratings are too uniform (4.0–4.8) to differentiate sellers.
 */
export function computeCs(product) {
  return (product.trustScore != null ? product.trustScore : 70) / 100;
}

/**
 * Bv — Verification Status (0.5 | 0.75 | 1.0).
 * 1.0 = Amazon-fulfilled + seller rating ≥ 4.3
 * 0.75 = Amazon-fulfilled OR established independent
 * 0.5  = unverified third-party
 */
export function computeBv(product) {
  const isAFN  = (product.fulfillment || "").toLowerCase().includes("amazon");
  const rating = parseFloat(product.soldByRating) || 3.5;
  const age    = new Date().getFullYear() - parseInt(product.sellerSince || "2022");

  if (isAFN && rating >= 4.3) return 1.0;
  if (isAFN || (rating >= 4.0 && age >= 3)) return 0.75;
  return 0.5;
}

/** On-time delivery rate (%) from fulfillment type + seller rating. */
export function computeDeliveryRate(product) {
  const isAFN  = (product.fulfillment || "").toLowerCase().includes("amazon");
  const rating = parseFloat(product.soldByRating) || 3.5;
  if (isAFN) return Math.min(99, Math.round(93 + (rating - 3) * 3));
  return Math.min(95, Math.round(76 + (rating - 3) * 8));
}

/**
 * Core formula:  raw = w1·(1−Rg) + w2·(1−Od) + w3·Cs + w4·Bv
 * Weights: w1=0.05, w2=0.05, w3=0.80, w4=0.10
 * User returns: add to Rg (3% each) + direct 2-pt deduction per return
 *
 * Returns: { companyScore, status, Rg, Od, Cs, Bv, raw, returnPenalty }
 */
export function computeCompanyScore(product, sellerProducts, userReturns = 0) {
  let  Rg = computeRg(sellerProducts);
  const Od = computeOd(sellerProducts);
  const Cs = computeCs(product);
  const Bv = computeBv(product);

  Rg = Math.min(0.60, Rg + userReturns * 0.03);

  const w1 = 0.05, w2 = 0.05, w3 = 0.80, w4 = 0.10;
  const raw = w1 * (1 - Rg) + w2 * (1 - Od) + w3 * Cs + w4 * Bv;

  const returnPenalty = Math.min(30, userReturns * 2);
  const companyScore  = Math.max(5, Math.min(98, Math.round(raw * 100) - returnPenalty));
  const status        = scoreToStatus(companyScore);

  return { companyScore, status, Rg, Od, Cs, Bv, raw, returnPenalty };
}

export function scoreToStatus(score) {
  return score >= 80 ? "VERIFIED" : score >= 60 ? "MIXED" : "FLAGGED";
}
