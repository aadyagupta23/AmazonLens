/**
 * TrustLens™ Company / Seller Database
 * All sellers present in the AmazonLens product catalogue.
 * verified: true  → Brand Registry enrolled, strong compliance record
 * verified: false → Third-party / newer / unverified seller
 *
 * Trust metrics (returnRate, reorderRate, avgRating) are populated
 * dynamically from the customers database at runtime.
 *
 * Eco metrics (eco object) are static per-company attributes.
 * ecoScore is computed by computeCompanyEcoScore() at export time.
 *
 * ECO FORMULA:
 *   baseScore = 0.25 × carbonReductionTarget
 *             + 0.20 × renewableEnergyPct
 *             + 0.20 × recyclablePackagingPct
 *             + 0.20 × supplyChainScore
 *             + 0.15 × productLongevityScore
 *   certBonus = min(10, certifications.length × 2.5)
 *   ecoScore  = round(min(99, baseScore + certBonus))
 *
 * Attribute definitions (all 0–100):
 *   carbonReductionTarget    — stated CO₂ reduction commitment vs industry baseline
 *   renewableEnergyPct       — % of operations powered by renewable energy
 *   recyclablePackagingPct   — % of packaging that is recyclable / compostable
 *   supplyChainScore         — sourcing transparency + ethical procurement practices
 *   productLongevityScore    — avg product lifespan + repairability / durability
 *   certifications           — verified third-party environmental certifications
 */

import { getSellerReturnRate, getSellerReorderRate, getSellerAvgRating } from "./customers.js";

// ── Eco scoring ───────────────────────────────────────────────────────────────

export function computeCompanyEcoScore(eco) {
  if (!eco) return null;
  const base =
    0.25 * eco.carbonReductionTarget +
    0.20 * eco.renewableEnergyPct +
    0.20 * eco.recyclablePackagingPct +
    0.20 * eco.supplyChainScore +
    0.15 * eco.productLongevityScore;
  const certBonus = Math.min(10, (eco.certifications?.length || 0) * 2.5);
  return Math.round(Math.min(99, base + certBonus));
}

export function getEcoLabel(score) {
  if (score == null) return "Unknown";
  if (score >= 90) return "Climate Leader";
  if (score >= 80) return "Eco Advanced";
  if (score >= 70) return "Eco Conscious";
  if (score >= 60) return "Eco Aware";
  if (score >= 50) return "Progressing";
  if (score >= 40) return "Developing";
  return "Early Stage";
}

const COMPANY_PROFILES = [
  {
    id:          "co001",
    name:        "Amazon",
    verified:    true,
    category:    "E-Commerce / Consumer Electronics",
    foundedYear: 1994,
    sellerRating: 4.8,
    fulfillment: "Fulfilled by Amazon",
    description: "Amazon's own retail arm, selling first-party products including Fire TV, Echo, Kindle, and AmazonBasics. Highest trust tier.",
    hq:          "Seattle, USA (India ops: Mumbai)",
    products:    ["p008","p037"],
    // Climate Pledge signatory (net zero by 2040), Shipment Zero, large renewable energy portfolio
    eco: {
      carbonReductionTarget:   78,
      renewableEnergyPct:      72,
      recyclablePackagingPct:  85,
      supplyChainScore:        65,
      productLongevityScore:   60,
      certifications: ["ISO 14001", "Energy Star", "Climate Pledge Friendly"],
    },
  },
  {
    id:          "co002",
    name:        "Appario Retail Pvt Ltd",
    verified:    true,
    category:    "Multi-category Retail",
    foundedYear: 2014,
    sellerRating: 4.8,
    fulfillment: "Fulfilled by Amazon",
    description: "Amazon's primary retail partner in India. Sells across electronics, accessories, home goods, and stationery.",
    hq:          "Mumbai, Maharashtra",
    products:    ["p003","p013","p020","p022","p024","p032"],
    // Benefits from Amazon FBA packaging standards; no independent eco programme
    eco: {
      carbonReductionTarget:   45,
      renewableEnergyPct:      52,
      recyclablePackagingPct:  68,
      supplyChainScore:        62,
      productLongevityScore:   55,
      certifications: [],
    },
  },
  {
    id:          "co003",
    name:        "Cloudtail India",
    verified:    true,
    category:    "Multi-category Retail",
    foundedYear: 2012,
    sellerRating: 4.6,
    fulfillment: "Fulfilled by Amazon",
    description: "Major Amazon marketplace seller covering consumer electronics, home, and lifestyle. Long-standing verified partner.",
    hq:          "Bengaluru, Karnataka",
    products:    ["p001","p023","p028","p035"],
    // Older reseller; limited sustainability disclosures
    eco: {
      carbonReductionTarget:   40,
      renewableEnergyPct:      48,
      recyclablePackagingPct:  62,
      supplyChainScore:        58,
      productLongevityScore:   52,
      certifications: [],
    },
  },
  {
    id:          "co004",
    name:        "Samsung India Electronics",
    verified:    true,
    category:    "Consumer Electronics",
    foundedYear: 1995,
    sellerRating: 4.5,
    fulfillment: "Fulfilled by Amazon",
    description: "Official Samsung India store. Sells TVs, monitors, mobile phones, and home appliances directly on Amazon.",
    hq:          "Gurugram, Haryana",
    products:    ["p006","p036"],
    // Galaxy for the Planet initiative; device longevity via software updates; ISO 14001
    eco: {
      carbonReductionTarget:   70,
      renewableEnergyPct:      62,
      recyclablePackagingPct:  72,
      supplyChainScore:        72,
      productLongevityScore:   78,
      certifications: ["ISO 14001", "Energy Star"],
    },
  },
  {
    id:          "co005",
    name:        "JBL Official Store",
    verified:    true,
    category:    "Audio Equipment",
    foundedYear: 1946,
    sellerRating: 4.7,
    fulfillment: "Fulfilled by Amazon",
    description: "Harman International's JBL brand sold directly in India. Specialises in speakers, headphones, and soundbars.",
    hq:          "Stamford, USA (India: Bengaluru)",
    products:    ["p002","p026"],
    // Harman parent has ISO 14001; JBL products are built for longevity
    eco: {
      carbonReductionTarget:   55,
      renewableEnergyPct:      50,
      recyclablePackagingPct:  62,
      supplyChainScore:        65,
      productLongevityScore:   82,
      certifications: ["ISO 14001"],
    },
  },
  {
    id:          "co006",
    name:        "TTK Prestige Limited",
    verified:    true,
    category:    "Kitchen Appliances",
    foundedYear: 1955,
    sellerRating: 4.6,
    fulfillment: "Fulfilled by Amazon",
    description: "India's largest kitchen appliance brand. Official Amazon seller for pressure cookers, kettles, and cookware.",
    hq:          "Bengaluru, Karnataka",
    products:    ["p007","p029"],
    // Pressure cookers / stainless steel cookware last decades; limited renewable commitments
    eco: {
      carbonReductionTarget:   40,
      renewableEnergyPct:      38,
      recyclablePackagingPct:  55,
      supplyChainScore:        62,
      productLongevityScore:   88,
      certifications: [],
    },
  },
  {
    id:          "co007",
    name:        "Nestle India",
    verified:    true,
    category:    "Food & Beverage",
    foundedYear: 1961,
    sellerRating: 4.5,
    fulfillment: "Fulfilled by Amazon",
    description: "Nestlé's India subsidiary. Sells Nescafé, Maggi, KitKat, and other FMCG products directly.",
    hq:          "Gurugram, Haryana",
    products:    ["p005"],
    // Pledged 100% recyclable packaging by 2025; FMCG = inherently short lifecycle
    eco: {
      carbonReductionTarget:   52,
      renewableEnergyPct:      45,
      recyclablePackagingPct:  62,
      supplyChainScore:        52,
      productLongevityScore:   28,
      certifications: ["ISO 14001"],
    },
  },
  {
    id:          "co008",
    name:        "Milton Retail India",
    verified:    true,
    category:    "Kitchenware / Lifestyle",
    foundedYear: 1972,
    sellerRating: 4.7,
    fulfillment: "Fulfilled by Amazon",
    description: "Milton's official Amazon presence. Premium stainless steel and plastic drinkware and storage products.",
    hq:          "Mumbai, Maharashtra",
    products:    ["p010"],
    // Stainless steel is endlessly recyclable and lasts decades
    eco: {
      carbonReductionTarget:   40,
      renewableEnergyPct:      36,
      recyclablePackagingPct:  72,
      supplyChainScore:        62,
      productLongevityScore:   94,
      certifications: ["BIS Certified"],
    },
  },
  {
    id:          "co009",
    name:        "Anker Official India",
    verified:    true,
    category:    "Tech Accessories",
    foundedYear: 2011,
    sellerRating: 4.6,
    fulfillment: "Fulfilled by Amazon",
    description: "Anker's official Indian store. Sells USB hubs, chargers, cables, and portable power products.",
    hq:          "Shenzhen, China (India: Delhi)",
    products:    ["p025"],
    // RoHS + CE compliant; GaN charger tech reduces energy waste; durable build
    eco: {
      carbonReductionTarget:   50,
      renewableEnergyPct:      44,
      recyclablePackagingPct:  66,
      supplyChainScore:        58,
      productLongevityScore:   76,
      certifications: ["RoHS", "CE"],
    },
  },
  {
    id:          "co010",
    name:        "Signify Innovations India",
    verified:    true,
    category:    "Lighting",
    foundedYear: 2018,
    sellerRating: 4.5,
    fulfillment: "Fulfilled by Amazon",
    description: "Philips Lighting's Indian entity (Signify). Sells LED bulbs, smart lighting, and study lamps.",
    hq:          "Gurugram, Haryana",
    products:    ["p019"],
    // Signify: 100% renewable electricity since 2020; EcoDesign compliance; circular lighting
    eco: {
      carbonReductionTarget:   82,
      renewableEnergyPct:      88,
      recyclablePackagingPct:  78,
      supplyChainScore:        74,
      productLongevityScore:   72,
      certifications: ["ISO 14001", "Energy Star", "EcoDesign"],
    },
  },
  {
    id:          "co011",
    name:        "ITC Classmate Store",
    verified:    true,
    category:    "Stationery / Education",
    foundedYear: 2003,
    sellerRating: 4.6,
    fulfillment: "Merchant Fulfilled",
    description: "ITC's Classmate stationery brand sold directly. Notebooks, pens, art supplies.",
    hq:          "Kolkata, West Bengal",
    products:    ["p011"],
    // ITC: water positive, carbon positive; Classmate uses recycled paper; FSC certified
    eco: {
      carbonReductionTarget:   74,
      renewableEnergyPct:      68,
      recyclablePackagingPct:  82,
      supplyChainScore:        72,
      productLongevityScore:   62,
      certifications: ["FSC", "ISO 14001"],
    },
  },
  {
    id:          "co012",
    name:        "Wipro Consumer Lighting",
    verified:    true,
    category:    "Lighting / Smart Home",
    foundedYear: 1945,
    sellerRating: 4.4,
    fulfillment: "Fulfilled by Amazon",
    description: "Wipro's consumer products division. LED bulbs, smart plugs, and home automation solutions.",
    hq:          "Bengaluru, Karnataka",
    products:    ["p014","p033","p038"],
    // Wipro: strong ESG reporting, 75%+ renewable in Indian ops, BEE Star rated products
    eco: {
      carbonReductionTarget:   72,
      renewableEnergyPct:      78,
      recyclablePackagingPct:  70,
      supplyChainScore:        74,
      productLongevityScore:   80,
      certifications: ["ISO 14001", "BEE Star", "RoHS"],
    },
  },
  {
    id:          "co013",
    name:        "Green Soul Ergonomics",
    verified:    true,
    category:    "Furniture / Office",
    foundedYear: 2016,
    sellerRating: 4.6,
    fulfillment: "Fulfilled by Amazon",
    description: "India's leading ergonomic chair and desk brand. Verified seller with strong review track record.",
    hq:          "Mumbai, Maharashtra",
    products:    ["p017"],
    // Ergonomic furniture lasts 7-10 years; BIFMA certified; moderate supply chain
    eco: {
      carbonReductionTarget:   58,
      renewableEnergyPct:      50,
      recyclablePackagingPct:  68,
      supplyChainScore:        65,
      productLongevityScore:   90,
      certifications: ["BIFMA"],
    },
  },
  // ── Unverified / Third-party sellers ─────────────────────────────────────
  {
    id:          "co014",
    name:        "boAt Official Store",
    verified:    false,
    category:    "Consumer Audio",
    foundedYear: 2016,
    sellerRating: 3.9,
    fulfillment: "Fulfilled by Amazon",
    description: "boAt's direct Amazon store. Budget audio products with high sales volume but mixed review quality signals.",
    hq:          "Delhi, India",
    products:    ["p004"],
    verificationNote: "Not Brand Registry verified. Elevated suspicious review ratio detected.",
    // Budget brand; no published sustainability targets; short product lifecycles
    eco: {
      carbonReductionTarget:   28,
      renewableEnergyPct:      22,
      recyclablePackagingPct:  42,
      supplyChainScore:        35,
      productLongevityScore:   46,
      certifications: ["RoHS"],
    },
  },
  {
    id:          "co015",
    name:        "Ambrane India",
    verified:    false,
    category:    "Mobile Accessories / Power",
    foundedYear: 2012,
    sellerRating: 4.0,
    fulfillment: "Fulfilled by Amazon",
    description: "Budget power banks and mobile accessories. Not enrolled in Brand Registry. Mixed customer experience reported.",
    hq:          "Delhi, India",
    products:    ["p015"],
    verificationNote: "Brand Registry not verified. Above-average return rate on power products.",
    // Entry-level accessories; no meaningful eco programme; basic RoHS compliance
    eco: {
      carbonReductionTarget:   32,
      renewableEnergyPct:      28,
      recyclablePackagingPct:  45,
      supplyChainScore:        38,
      productLongevityScore:   52,
      certifications: ["RoHS"],
    },
  },
  {
    id:          "co016",
    name:        "Bewakoof Brands",
    verified:    false,
    category:    "Apparel / Fashion",
    foundedYear: 2012,
    sellerRating: 4.1,
    fulfillment: "Fulfilled by Amazon",
    description: "Indian D2C fashion brand. Size and quality inconsistency contributes to moderate return rates.",
    hq:          "Mumbai, Maharashtra",
    products:    ["p012"],
    verificationNote: "Fashion category seller — higher return rate is category-typical but unverified.",
    // Some organic cotton lines; no GOTS/OEKO-TEX; packaging partially recyclable
    eco: {
      carbonReductionTarget:   45,
      renewableEnergyPct:      38,
      recyclablePackagingPct:  55,
      supplyChainScore:        50,
      productLongevityScore:   58,
      certifications: ["OEKO-TEX"],
    },
  },
  {
    id:          "co017",
    name:        "EcoSmile Retail",
    verified:    false,
    category:    "Eco Products / Personal Care",
    foundedYear: 2021,
    sellerRating: 4.3,
    fulfillment: "Fulfilled by Amazon",
    description: "Newer eco-friendly brand. Insufficient tenure data for full verification.",
    hq:          "Bengaluru, Karnataka",
    products:    ["p009"],
    verificationNote: "New seller (2021). Verification pending tenure requirements.",
    // Core mission is sustainability; biodegradable bamboo products; zero plastic packaging
    eco: {
      carbonReductionTarget:   88,
      renewableEnergyPct:      78,
      recyclablePackagingPct:  95,
      supplyChainScore:        82,
      productLongevityScore:   70,
      certifications: ["USDA Organic", "FSC", "OEKO-TEX", "B Corp Aligned"],
    },
  },
  {
    id:          "co018",
    name:        "Cosmic Byte Store",
    verified:    false,
    category:    "Gaming Accessories",
    foundedYear: 2016,
    sellerRating: 4.4,
    fulfillment: "Fulfilled by Amazon",
    description: "Budget gaming peripherals and accessories. Third-party seller not enrolled in Brand Registry.",
    hq:          "Delhi, India",
    products:    ["p027"],
    verificationNote: "Third-party gaming accessories seller. Not Brand Registry enrolled.",
    // Gaming hardware; no sustainability disclosures; basic compliance only
    eco: {
      carbonReductionTarget:   30,
      renewableEnergyPct:      24,
      recyclablePackagingPct:  40,
      supplyChainScore:        35,
      productLongevityScore:   48,
      certifications: ["RoHS"],
    },
  },
  {
    id:          "co019",
    name:        "Origin Games",
    verified:    false,
    category:    "Gaming / Peripherals",
    foundedYear: 2017,
    sellerRating: 4.3,
    fulfillment: "Fulfilled by Amazon",
    description: "Gaming keyboard and peripheral distributor. Sells branded products as third-party reseller.",
    hq:          "Hyderabad, Telangana",
    products:    ["p021"],
    verificationNote: "Reseller, not brand-direct. No Brand Registry enrollment.",
    // Reseller; relies on brand-level compliance; minimal own eco footprint
    eco: {
      carbonReductionTarget:   33,
      renewableEnergyPct:      28,
      recyclablePackagingPct:  44,
      supplyChainScore:        40,
      productLongevityScore:   52,
      certifications: ["RoHS"],
    },
  },
  {
    id:          "co020",
    name:        "Elite Gaming Distribution",
    verified:    false,
    category:    "Gaming Peripherals",
    foundedYear: 2018,
    sellerRating: 4.5,
    fulfillment: "Fulfilled by Amazon",
    description: "Distributes Razer and other gaming peripherals in India. Third-party distributor, not brand-direct.",
    hq:          "Mumbai, Maharashtra",
    products:    ["p034"],
    verificationNote: "Distributor, not brand-direct. Verify authenticity before purchase.",
    // Distributor; slightly better supply chain visibility than pure resellers
    eco: {
      carbonReductionTarget:   35,
      renewableEnergyPct:      28,
      recyclablePackagingPct:  45,
      supplyChainScore:        40,
      productLongevityScore:   52,
      certifications: ["RoHS"],
    },
  },
  {
    id:          "co021",
    name:        "Stovekraft Limited",
    verified:    false,
    category:    "Kitchen Appliances",
    foundedYear: 1991,
    sellerRating: 4.1,
    fulfillment: "Fulfilled by Amazon",
    description: "Makes Pigeon and Gilma brand appliances. Not directly enrolled in Amazon Brand Registry.",
    hq:          "Bengaluru, Karnataka",
    products:    ["p030"],
    verificationNote: "Brand Registry verification pending. Lower seller rating than category peers.",
    // Cookware and appliances last years; limited eco programme but durable products
    eco: {
      carbonReductionTarget:   40,
      renewableEnergyPct:      34,
      recyclablePackagingPct:  52,
      supplyChainScore:        48,
      productLongevityScore:   82,
      certifications: [],
    },
  },
  {
    id:          "co022",
    name:        "Cello Retail Online",
    verified:    false,
    category:    "Home Storage / Plastics",
    foundedYear: 2016,
    sellerRating: 4.3,
    fulfillment: "Merchant Fulfilled",
    description: "Cello brand's online retail presence. Merchant-fulfilled orders with moderate delivery reliability.",
    hq:          "Mumbai, Maharashtra",
    products:    ["p031"],
    verificationNote: "Merchant-fulfilled. Delivery reliability lower than FBA peers.",
    // Plastic-heavy product line; some BPA-free claims; no meaningful eco targets
    eco: {
      carbonReductionTarget:   38,
      renewableEnergyPct:      32,
      recyclablePackagingPct:  55,
      supplyChainScore:        45,
      productLongevityScore:   68,
      certifications: [],
    },
  },
  {
    id:          "co023",
    name:        "Freudenberg Household India",
    verified:    false,
    category:    "Household / Cleaning",
    foundedYear: 2012,
    sellerRating: 4.5,
    fulfillment: "Fulfilled by Amazon",
    description: "Sells Gala and Vileda cleaning products. Legitimate brand but not enrolled in Amazon Brand Registry.",
    hq:          "Mumbai, Maharashtra",
    products:    ["p016"],
    verificationNote: "No Brand Registry enrollment despite established brand presence.",
    // Freudenberg parent has ISO 14001; Vileda products have some eco-material ranges
    eco: {
      carbonReductionTarget:   50,
      renewableEnergyPct:      44,
      recyclablePackagingPct:  65,
      supplyChainScore:        58,
      productLongevityScore:   72,
      certifications: ["ISO 14001"],
    },
  },
  {
    id:          "co024",
    name:        "Portronics Digital",
    verified:    false,
    category:    "Tech Accessories",
    foundedYear: 2010,
    sellerRating: 4.2,
    fulfillment: "Fulfilled by Amazon",
    description: "Budget tech accessories — laptop stands, wireless chargers, cables. Third-party seller.",
    hq:          "Delhi, India",
    products:    ["p018"],
    verificationNote: "Third-party accessories seller. Not Brand Registry verified.",
    // Budget accessories; basic compliance; moderate longevity
    eco: {
      carbonReductionTarget:   35,
      renewableEnergyPct:      30,
      recyclablePackagingPct:  48,
      supplyChainScore:        42,
      productLongevityScore:   62,
      certifications: ["RoHS"],
    },
  },
];

// ── Build export with live trust metrics + computed eco score ─────────────────
export const companies = COMPANY_PROFILES.map((co) => {
  const ecoScore = computeCompanyEcoScore(co.eco);
  return {
    ...co,
    trustMetrics: {
      returnRate:   getSellerReturnRate(co.name),
      reorderRate:  getSellerReorderRate(co.name),
      avgRating:    getSellerAvgRating(co.name),
    },
    ecoScore,
    ecoLabel: getEcoLabel(ecoScore),
  };
});

// ── Query helpers ─────────────────────────────────────────────────────────────

export function getCompanyById(id) {
  return companies.find((c) => c.id === id) || null;
}

export function getCompanyByName(name) {
  return companies.find((c) => c.name === name) || null;
}

export function isVerifiedSeller(sellerName) {
  const co = getCompanyByName(sellerName);
  return co ? co.verified : false;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function addCompany(data) {
  const id = `co${String(companies.length + 1).padStart(3, "0")}`;
  const base = {
    id, verified: false, foundedYear: new Date().getFullYear(),
    trustMetrics: { returnRate: 0.10, reorderRate: 0.20, avgRating: 4.0 },
    eco: null, ecoScore: null, ecoLabel: "Unknown",
    products: [],
  };
  const fresh = { ...base, ...data };
  if (fresh.eco) {
    fresh.ecoScore = computeCompanyEcoScore(fresh.eco);
    fresh.ecoLabel = getEcoLabel(fresh.ecoScore);
  }
  companies.push(fresh);
  return fresh;
}

export function refreshCompanyMetrics(sellerName) {
  const co = getCompanyByName(sellerName);
  if (!co) return null;
  co.trustMetrics = {
    returnRate:  getSellerReturnRate(sellerName),
    reorderRate: getSellerReorderRate(sellerName),
    avgRating:   getSellerAvgRating(sellerName),
  };
  return co;
}
