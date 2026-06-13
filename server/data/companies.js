/**
 * TrustLens™ Company / Seller Database
 * All sellers present in the AmazonLens product catalogue.
 * verified: true  → Brand Registry enrolled, strong compliance record
 * verified: false → Third-party / newer / unverified seller
 *
 * Trust metrics (returnRate, reorderRate, avgRating) are populated
 * dynamically from the customers database at runtime.
 */

import { getSellerReturnRate, getSellerReorderRate, getSellerAvgRating } from "./customers.js";

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
  },
];

// ── Build export with live trust metrics from customers db ────────────────────
export const companies = COMPANY_PROFILES.map((co) => ({
  ...co,
  trustMetrics: {
    returnRate:   getSellerReturnRate(co.name),
    reorderRate:  getSellerReorderRate(co.name),
    avgRating:    getSellerAvgRating(co.name),
  },
}));

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
  const fresh = {
    id, verified: false, foundedYear: new Date().getFullYear(),
    trustMetrics: { returnRate: 0.10, reorderRate: 0.20, avgRating: 4.0 },
    products: [],
    ...data,
  };
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
