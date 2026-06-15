/**
 * Sustainability utilities for AmazonLens.
 *
 * Eco scores are computed from company eco attributes (same data as server/data/companies.js).
 * Sub-metrics map directly to real company attributes — no scores are hardcoded.
 *
 * getSustainabilityData(productId)  — computed eco breakdown for any product
 * getUserSustainabilityScore(items) — compute user score from cart/purchase items
 * getSustainabilityColor(score)     — colour tokens matching TrustLens palette
 */

/**
 * Company eco attributes — mirrors server/data/companies.js eco objects.
 * Scores are derived from these attributes, not set directly.
 *
 * carbonReductionTarget  — stated CO₂ reduction commitment vs industry baseline (0-100)
 * renewableEnergyPct     — % of operations on renewable energy (0-100)
 * recyclablePackagingPct — % of packaging recyclable/compostable (0-100)
 * supplyChainScore       — sourcing transparency + ethical procurement (0-100)
 * productLongevityScore  — avg product lifespan + repairability (0-100)
 * certCount              — number of verified third-party environmental certifications
 */
const COMPANY_ECO = {
  co001: { carbonReductionTarget: 78, renewableEnergyPct: 72, recyclablePackagingPct: 85, supplyChainScore: 65, productLongevityScore: 60, certCount: 3 },  // Amazon
  co002: { carbonReductionTarget: 45, renewableEnergyPct: 52, recyclablePackagingPct: 68, supplyChainScore: 62, productLongevityScore: 55, certCount: 0 },  // Appario
  co003: { carbonReductionTarget: 40, renewableEnergyPct: 48, recyclablePackagingPct: 62, supplyChainScore: 58, productLongevityScore: 52, certCount: 0 },  // Cloudtail
  co004: { carbonReductionTarget: 70, renewableEnergyPct: 62, recyclablePackagingPct: 72, supplyChainScore: 72, productLongevityScore: 78, certCount: 2 },  // Samsung
  co005: { carbonReductionTarget: 55, renewableEnergyPct: 50, recyclablePackagingPct: 62, supplyChainScore: 65, productLongevityScore: 82, certCount: 1 },  // JBL
  co006: { carbonReductionTarget: 40, renewableEnergyPct: 38, recyclablePackagingPct: 55, supplyChainScore: 62, productLongevityScore: 88, certCount: 0 },  // TTK Prestige
  co007: { carbonReductionTarget: 52, renewableEnergyPct: 45, recyclablePackagingPct: 62, supplyChainScore: 52, productLongevityScore: 28, certCount: 1 },  // Nestle
  co008: { carbonReductionTarget: 40, renewableEnergyPct: 36, recyclablePackagingPct: 72, supplyChainScore: 62, productLongevityScore: 94, certCount: 1 },  // Milton
  co009: { carbonReductionTarget: 50, renewableEnergyPct: 44, recyclablePackagingPct: 66, supplyChainScore: 58, productLongevityScore: 76, certCount: 2 },  // Anker
  co010: { carbonReductionTarget: 82, renewableEnergyPct: 88, recyclablePackagingPct: 78, supplyChainScore: 74, productLongevityScore: 72, certCount: 3 },  // Signify (Philips)
  co011: { carbonReductionTarget: 74, renewableEnergyPct: 68, recyclablePackagingPct: 82, supplyChainScore: 72, productLongevityScore: 62, certCount: 2 },  // ITC Classmate
  co012: { carbonReductionTarget: 72, renewableEnergyPct: 78, recyclablePackagingPct: 70, supplyChainScore: 74, productLongevityScore: 80, certCount: 3 },  // Wipro Consumer Lighting
  co013: { carbonReductionTarget: 58, renewableEnergyPct: 50, recyclablePackagingPct: 68, supplyChainScore: 65, productLongevityScore: 90, certCount: 1 },  // Green Soul
  co014: { carbonReductionTarget: 28, renewableEnergyPct: 22, recyclablePackagingPct: 42, supplyChainScore: 35, productLongevityScore: 46, certCount: 1 },  // boAt
  co015: { carbonReductionTarget: 32, renewableEnergyPct: 28, recyclablePackagingPct: 45, supplyChainScore: 38, productLongevityScore: 52, certCount: 1 },  // Ambrane
  co016: { carbonReductionTarget: 45, renewableEnergyPct: 38, recyclablePackagingPct: 55, supplyChainScore: 50, productLongevityScore: 58, certCount: 1 },  // Bewakoof
  co017: { carbonReductionTarget: 88, renewableEnergyPct: 78, recyclablePackagingPct: 95, supplyChainScore: 82, productLongevityScore: 70, certCount: 4 },  // EcoSmile
  co018: { carbonReductionTarget: 30, renewableEnergyPct: 24, recyclablePackagingPct: 40, supplyChainScore: 35, productLongevityScore: 48, certCount: 1 },  // Cosmic Byte
  co019: { carbonReductionTarget: 33, renewableEnergyPct: 28, recyclablePackagingPct: 44, supplyChainScore: 40, productLongevityScore: 52, certCount: 1 },  // Origin Games
  co020: { carbonReductionTarget: 35, renewableEnergyPct: 28, recyclablePackagingPct: 45, supplyChainScore: 40, productLongevityScore: 52, certCount: 1 },  // Elite Gaming
  co021: { carbonReductionTarget: 40, renewableEnergyPct: 34, recyclablePackagingPct: 52, supplyChainScore: 48, productLongevityScore: 82, certCount: 0 },  // Stovekraft
  co022: { carbonReductionTarget: 38, renewableEnergyPct: 32, recyclablePackagingPct: 55, supplyChainScore: 45, productLongevityScore: 68, certCount: 0 },  // Cello
  co023: { carbonReductionTarget: 50, renewableEnergyPct: 44, recyclablePackagingPct: 65, supplyChainScore: 58, productLongevityScore: 72, certCount: 1 },  // Freudenberg
  co024: { carbonReductionTarget: 35, renewableEnergyPct: 30, recyclablePackagingPct: 48, supplyChainScore: 42, productLongevityScore: 62, certCount: 1 },  // Portronics
};

// Maps product IDs to their seller company — derived from companies.js products arrays
const PRODUCT_COMPANY = {
  p001: "co003", p002: "co005", p003: "co002", p004: "co014", p005: "co007",
  p006: "co004", p007: "co006", p008: "co001", p009: "co017", p010: "co008",
  p011: "co011", p012: "co016", p013: "co002", p014: "co012", p015: "co015",
  p016: "co023", p017: "co013", p018: "co024", p019: "co010", p020: "co002",
  p021: "co019", p022: "co002", p023: "co003", p024: "co002", p025: "co009",
  p026: "co005", p027: "co018", p028: "co003", p029: "co006", p030: "co021",
  p031: "co022", p032: "co002", p033: "co012", p034: "co020", p035: "co003",
  p036: "co004", p037: "co001", p038: "co012",
};

/**
 * Computes overall eco score from company attributes.
 * Mirrors computeCompanyEcoScore() in server/data/companies.js.
 */
function computeEcoScore(eco) {
  const base =
    0.25 * eco.carbonReductionTarget +
    0.20 * eco.renewableEnergyPct +
    0.20 * eco.recyclablePackagingPct +
    0.20 * eco.supplyChainScore +
    0.15 * eco.productLongevityScore;
  const certBonus = Math.min(10, eco.certCount * 2.5);
  return Math.round(Math.min(99, base + certBonus));
}

// Seeded pseudo-random for unknown products only
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

/**
 * Returns a deterministic sustainability breakdown for any product id.
 * For known products, each sub-metric is computed from real company eco attributes.
 * carbonFootprint  ← weighted average of carbon reduction + renewable energy commitment
 * recyclability    ← packaging recyclability + product longevity (longer life = less waste)
 * packagingImpact  ← recyclable packaging percentage directly
 * ethicalSourcing  ← supply chain transparency score
 */
export function getSustainabilityData(productId) {
  const companyId = PRODUCT_COMPANY[productId];
  const eco = companyId ? COMPANY_ECO[companyId] : null;

  if (eco) {
    return {
      score:           computeEcoScore(eco),
      carbonFootprint: Math.round(eco.carbonReductionTarget * 0.6 + eco.renewableEnergyPct * 0.4),
      recyclability:   Math.round(eco.recyclablePackagingPct * 0.55 + eco.productLongevityScore * 0.45),
      packagingImpact: eco.recyclablePackagingPct,
      ethicalSourcing: eco.supplyChainScore,
      certified:       eco.certCount > 0,
    };
  }

  // Fallback for any product not in the map (random but deterministic)
  const seed = strHash(String(productId));
  const base = Math.round(35 + sr(seed, 0) * 30); // caps at 65 so nothing unknown gets Greener Choice
  const clamp = (v) => Math.max(10, Math.min(80, v));
  return {
    score:           clamp(base),
    carbonFootprint: clamp(base + Math.round((sr(seed, 1) - 0.5) * 18)),
    recyclability:   clamp(base + Math.round((sr(seed, 2) - 0.5) * 18)),
    packagingImpact: clamp(base + Math.round((sr(seed, 3) - 0.5) * 15)),
    ethicalSourcing: clamp(base + Math.round((sr(seed, 4) - 0.5) * 16)),
    certified:       sr(seed, 5) > 0.75,
  };
}

/**
 * Returns colour tokens for a given sustainability score.
 */
export function getSustainabilityColor(score) {
  if (score >= 75) return { bg: "bg-[#1B5E20]", text: "text-white", label: "Eco-Friendly", hex: "#1B5E20", light: "bg-green-50", lightText: "text-[#1B5E20]" };
  if (score >= 50) return { bg: "bg-[#558B2F]", text: "text-white", label: "Moderate",     hex: "#558B2F", light: "bg-lime-50",  lightText: "text-[#558B2F]" };
  return                 { bg: "bg-[#827717]", text: "text-white", label: "Low Impact",    hex: "#827717", light: "bg-yellow-50", lightText: "text-[#827717]" };
}

/**
 * Computes a user-level sustainability score from an array of cart/purchase items.
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
