/**
 * Sustainability utilities for AmazonLens.
 *
 * getSustainabilityData(productId)  — deterministic mock data for any product
 * getUserSustainabilityScore(items) — compute user score from cart/purchase items
 * getSustainabilityColor(score)     — colour tokens matching TrustLens palette
 */

// Seeded pseudo-random — same product always gets the same score
function sr(seed, offset = 0) {
  const x = Math.sin(seed * 7919 + offset * 48611 + 137) * 1e6;
  return x - Math.floor(x);
}

function strHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul((h << 5) - h, 1) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Hand-crafted data for the 8 mock products
const PRODUCT_OVERRIDES = {
  p001: { score: 62, carbonFootprint: 58, recyclability: 70, packagingImpact: 65, ethicalSourcing: 55, certified: false },
  p002: { score: 74, carbonFootprint: 72, recyclability: 78, packagingImpact: 74, ethicalSourcing: 72, certified: true  },
  p003: { score: 68, carbonFootprint: 60, recyclability: 72, packagingImpact: 68, ethicalSourcing: 70, certified: false },
  p004: { score: 45, carbonFootprint: 40, recyclability: 52, packagingImpact: 45, ethicalSourcing: 42, certified: false },
  p005: { score: 88, carbonFootprint: 90, recyclability: 88, packagingImpact: 86, ethicalSourcing: 88, certified: true  },
  p006: { score: 71, carbonFootprint: 68, recyclability: 75, packagingImpact: 72, ethicalSourcing: 69, certified: false },
  p007: { score: 83, carbonFootprint: 82, recyclability: 86, packagingImpact: 84, ethicalSourcing: 80, certified: true  },
  p008: { score: 77, carbonFootprint: 75, recyclability: 80, packagingImpact: 76, ethicalSourcing: 76, certified: false },
};

/**
 * Returns a deterministic sustainability breakdown for any product id.
 */
export function getSustainabilityData(productId) {
  if (PRODUCT_OVERRIDES[productId]) return PRODUCT_OVERRIDES[productId];

  const seed = strHash(String(productId));
  const base = Math.round(35 + sr(seed, 0) * 55); // 35–90

  const clamp = (v) => Math.max(10, Math.min(98, v));
  return {
    score:            clamp(base),
    carbonFootprint:  clamp(base + Math.round((sr(seed, 1) - 0.5) * 22)),
    recyclability:    clamp(base + Math.round((sr(seed, 2) - 0.5) * 22)),
    packagingImpact:  clamp(base + Math.round((sr(seed, 3) - 0.5) * 18)),
    ethicalSourcing:  clamp(base + Math.round((sr(seed, 4) - 0.5) * 20)),
    certified:        sr(seed, 5) > 0.65,
  };
}

/**
 * Returns colour tokens for a given sustainability score.
 * Mirrors getTrustColor from format.js.
 */
export function getSustainabilityColor(score) {
  if (score >= 75) return { bg: "bg-[#1B5E20]", text: "text-white", label: "Eco-Friendly", hex: "#1B5E20", light: "bg-green-50", lightText: "text-[#1B5E20]" };
  if (score >= 50) return { bg: "bg-[#558B2F]", text: "text-white", label: "Moderate",     hex: "#558B2F", light: "bg-lime-50",  lightText: "text-[#558B2F]" };
  return                 { bg: "bg-[#827717]", text: "text-white", label: "Low Impact",    hex: "#827717", light: "bg-yellow-50", lightText: "text-[#827717]" };
}

/**
 * Computes a user-level sustainability score from an array of cart/purchase items.
 * Applies a small bonus for each active preference.
 */
export function getUserSustainabilityScore(items = [], prefs = {}) {
  if (items.length === 0) return null;

  const scores = items.map((item) => getSustainabilityData(item.id).score);
  const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  let bonus = 0;
  if (prefs.prioritizeEco)       bonus += 3;
  if (prefs.recyclablePackaging) bonus += 2;
  if (prefs.ethicalBrands)       bonus += 2;

  return Math.min(100, avg + bonus);
}
