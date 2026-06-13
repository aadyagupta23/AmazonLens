/**
 * TrustLens™ Customer Database
 * 200 deterministically-generated Indian customers with full order history
 * across all 38 featured products.
 *
 * ─── TRUST SCORE ARCHITECTURE ────────────────────────────────────────────────
 * trustScore in PRODUCT_META is used ONLY as a generation seed to create
 * realistic synthetic data. It is NOT the TrustLens score shown to buyers.
 *
 * The real TrustLens score is computed by computeProductTrustScore(productId)
 * from actual aggregated customer behaviour:
 *
 *   1. Return Rate   (35 pts) — % of customers who returned this product
 *   2. Reorder Rate  (30 pts) — reorder events ÷ total purchase events
 *   3. Avg Rating    (35 pts) — mean star rating across all verified reviews
 *
 * See computeProductTrustScore() at the bottom of this file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
function sr(a, b = 0, c = 0) {
  return (((Math.sin(a * 9301 + b * 49297 + c * 233) * 1e6) % 1) + 1) % 1;
}

// ── Demographics ──────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Aarav", "Aditi", "Arjun", "Ananya", "Rohan", "Priya", "Karan", "Kavya", "Vikram", "Sneha",
  "Rahul", "Pooja", "Siddharth", "Divya", "Nikhil", "Meera", "Aditya", "Neha", "Varun", "Ishaan",
  "Shruti", "Deepak", "Anjali", "Akash", "Riya", "Manish", "Simran", "Gaurav", "Kritika", "Suresh",
  "Lakshmi", "Harish", "Sonal", "Rajesh", "Pallavi", "Vijay", "Tanvi", "Mohit", "Nisha", "Tarun",
  "Revathi", "Sandeep", "Bhavna", "Dinesh", "Chitra", "Arun", "Sunita", "Pavan", "Heena", "Ravi",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Singh", "Gupta", "Nair", "Reddy", "Joshi", "Iyer", "Rao",
  "Kumar", "Mehta", "Chauhan", "Kapoor", "Menon", "Pillai", "Bhat", "Saxena", "Agarwal", "Tiwari",
  "Sinha", "Desai", "Jain", "Chopra", "Mishra", "Pandey", "Srivastava", "Murthy", "Naidu", "Hegde",
  "Shah", "Kulkarni", "Bhatt", "Banerjee", "Chatterjee", "Das", "Ghosh", "Sen", "Bose", "Malhotra",
];

const CITIES = [
  "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  "Jaipur", "Lucknow", "Kochi", "Chandigarh", "Bhubaneswar", "Indore", "Nagpur", "Surat",
  "Coimbatore", "Vizag", "Mysuru", "Vadodara",
];

const STATE_MAP = {
  Bengaluru: "Karnataka", Mysuru: "Karnataka", Hyderabad: "Telangana",
  Mumbai: "Maharashtra", Pune: "Maharashtra", Nagpur: "Maharashtra",
  Delhi: "Delhi", Jaipur: "Rajasthan", Lucknow: "Uttar Pradesh",
  Chennai: "Tamil Nadu", Coimbatore: "Tamil Nadu",
  Kolkata: "West Bengal", Ahmedabad: "Gujarat", Surat: "Gujarat", Vadodara: "Gujarat",
  Kochi: "Kerala", Chandigarh: "Punjab", Bhubaneswar: "Odisha",
  Indore: "Madhya Pradesh", Vizag: "Andhra Pradesh",
};

const RETURN_REASONS = [
  "Product not as described", "Defective or damaged item", "Wrong item delivered",
  "Changed my mind", "Better price found elsewhere", "Item arrived too late",
  "Product quality not satisfactory", "Duplicate purchase", "Gift return",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const REVIEW_TEMPLATES = {
  5: [
    { title: "Absolutely love this!", body: "Exactly what I was looking for. Quality is excellent and it arrived well-packaged. Would definitely recommend to anyone considering this product." },
    { title: "Exceeded my expectations", body: "Was a bit hesitant to buy online but this product has been amazing. Build quality is solid and performance is exactly as described. Very happy with the purchase." },
    { title: "Best purchase this year", body: "I've tried a few similar products before but this one is clearly superior. Great value for money and the quality speaks for itself. Will be buying again." },
    { title: "Outstanding quality", body: "The product quality is remarkable. Everything works perfectly right out of the box. Packaging was top-notch with no damage in transit. Highly satisfied." },
    { title: "Totally worth it", body: "Was reading reviews for weeks before finally ordering and I'm so glad I did. It's been performing flawlessly since day one. Highly recommend!" },
    { title: "Perfect in every way", body: "From delivery to quality, everything was perfect. The product matches the description exactly. Very impressed with this seller." },
    { title: "Great product, fast delivery", body: "Got it in 2 days which was a pleasant surprise. Product quality is excellent and it works exactly as expected. Great deal for the price." },
    { title: "Couldn't be happier", body: "This is exactly what I needed. The quality is fantastic and it feels very premium. I've already recommended it to three of my friends." },
    { title: "Superb purchase, no regrets", body: "Every rupee well spent. The product looks even better in person than in the photos. Seller packed it very carefully. Five stars all the way." },
    { title: "Reliable and premium quality", body: "Using it daily and it hasn't skipped a beat. Solid build, performs as advertised. Customer who is on the fence about this — just go for it." },
  ],
  4: [
    { title: "Good product, minor issues", body: "Overall a solid buy. Works well and quality is decent for the price. Just a small packaging concern but the product itself is fine. Would still recommend." },
    { title: "Very good, almost perfect", body: "The product does what it promises. Build quality is good and performance is consistent. Slightly pricier than expected but the quality justifies it." },
    { title: "Satisfied with the purchase", body: "Happy with the product overall. It works as advertised and delivery was on time. Small cosmetic imperfection on mine but nothing that affects performance." },
    { title: "Solid product", body: "Been using it for a few weeks now and it performs reliably. Wish the manual was more detailed but the product itself is good. Good value." },
    { title: "Good quality for the price", body: "Not the cheapest option out there but the quality is noticeably better than the alternatives. Good value if you're looking for something reliable." },
    { title: "Mostly impressed", body: "Works well and looks good. My only small gripe is the instructions could be clearer but I figured it out. Happy with the purchase overall." },
    { title: "Reliable and well-built", body: "Using it daily and it hasn't let me down once. Good quality materials and it does the job without fuss. Would buy from this seller again." },
    { title: "Pretty good overall", body: "It does what it says on the tin. Quality is decent, delivery was smooth. Not perfect but for this price range I'm happy with it." },
    { title: "Good buy, would recommend", body: "One small issue aside, this product has been a great addition. Works as described, looks exactly like the photos, and delivery was prompt." },
  ],
  3: [
    { title: "It's okay, nothing special", body: "Product is decent but doesn't stand out. Works as described but I feel the price is a bit high for what you get. Average experience overall." },
    { title: "Mixed feelings", body: "Some aspects are good, some are disappointing. It does the job but I expected a bit more based on the product description. Neutral overall." },
    { title: "Average product", body: "Neither good nor bad. It performs adequately but I've seen better quality at similar price points. Not something I'd go out of my way to recommend." },
    { title: "Could be better", body: "The product works but the build quality is just okay. For the price, I was expecting a bit more. It gets the job done but doesn't impress." },
    { title: "Decent but not outstanding", body: "It serves the purpose but don't expect anything exceptional. Quality is average and there are some rough edges. Might work for casual use." },
    { title: "Works, but has its quirks", body: "Functions as stated but I noticed some consistency issues. Nothing critical but for the price I expected better quality control." },
  ],
  2: [
    { title: "Disappointed with quality", body: "Expected better quality based on the description and photos. The product feels cheap and doesn't quite live up to what was advertised. Not great value." },
    { title: "Not as described", body: "The product arrived and wasn't quite what I expected from the listing. Quality is below par for the price. Would think twice before ordering again." },
    { title: "Below expectations", body: "The quality is noticeably lower than what's shown in the photos. Product does partially work but not the way I hoped. Quite disappointed." },
    { title: "Poor value for money", body: "The price is not justified by the quality. The product barely meets my needs and I feel like I overpaid significantly. Better options are available." },
  ],
  1: [
    { title: "Terrible quality, avoid", body: "Completely defective on arrival. Tried everything suggested in the manual but nothing worked. Had to go through the hassle of returning it. Very disappointed." },
    { title: "Complete waste of money", body: "This product failed within days of use. The quality is shockingly poor. Do not buy this — save your money and look elsewhere." },
    { title: "Defective item received", body: "The item I received was defective right out of the box. The quality is unacceptable for the price. Returning this immediately." },
    { title: "Worst purchase decision", body: "Absolutely terrible experience. The product stopped working within a week. Build quality feels like it was made to last a few days. Returned." },
  ],
};

// ── Product catalogue (trustScore = DATA GENERATION SEED only, not TrustLens score) ──
const PRODUCT_META = [
  { id: "p001", seller: "Cloudtail India", trustScore: 71, price: 54999 },
  { id: "p002", seller: "JBL Official Store", trustScore: 83, price: 8999 },
  { id: "p003", seller: "Appario Retail Pvt Ltd", trustScore: 91, price: 69999 },
  { id: "p004", seller: "boAt Official Store", trustScore: 48, price: 999 },
  { id: "p005", seller: "Nestle India", trustScore: 88, price: 649 },
  { id: "p006", seller: "Samsung India Electronics", trustScore: 79, price: 32999 },
  { id: "p007", seller: "TTK Prestige Limited", trustScore: 86, price: 1895 },
  { id: "p008", seller: "Amazon", trustScore: 92, price: 6999 },
  { id: "p009", seller: "EcoSmile Retail", trustScore: 89, price: 299 },
  { id: "p010", seller: "Milton Retail India", trustScore: 94, price: 949 },
  { id: "p011", seller: "ITC Classmate Store", trustScore: 87, price: 360 },
  { id: "p012", seller: "Bewakoof Brands", trustScore: 50, price: 499 },
  { id: "p013", seller: "Appario Retail Pvt Ltd", trustScore: 91, price: 349 },
  { id: "p014", seller: "Wipro Consumer Lighting", trustScore: 78, price: 599 },
  { id: "p015", seller: "Ambrane India", trustScore: 52, price: 1499 },
  { id: "p016", seller: "Freudenberg Household India", trustScore: 86, price: 449 },
  { id: "p017", seller: "Green Soul Ergonomics", trustScore: 88, price: 8499 },
  { id: "p018", seller: "Portronics Digital", trustScore: 90, price: 699 },
  { id: "p019", seller: "Signify Innovations India", trustScore: 92, price: 1199 },
  { id: "p020", seller: "Appario Retail Pvt Ltd", trustScore: 93, price: 399 },
  { id: "p021", seller: "Origin Games", trustScore: 55, price: 2899 },
  { id: "p022", seller: "Appario Retail Pvt Ltd", trustScore: 95, price: 649 },
  { id: "p023", seller: "Cloudtail India", trustScore: 88, price: 7999 },
  { id: "p024", seller: "Appario Retail Pvt Ltd", trustScore: 90, price: 1999 },
  { id: "p025", seller: "Anker Official India", trustScore: 94, price: 3299 },
  { id: "p026", seller: "JBL Official Store", trustScore: 84, price: 5499 },
  { id: "p027", seller: "Cosmic Byte Store", trustScore: 89, price: 449 },
  { id: "p028", seller: "Cloudtail India", trustScore: 92, price: 6499 },
  { id: "p029", seller: "TTK Prestige Limited", trustScore: 89, price: 749 },
  { id: "p030", seller: "Stovekraft Limited", trustScore: 83, price: 1599 },
  { id: "p031", seller: "Cello Retail Online", trustScore: 88, price: 499 },
  { id: "p032", seller: "Appario Retail Pvt Ltd", trustScore: 85, price: 899 },
  { id: "p033", seller: "Wipro Consumer Lighting", trustScore: 87, price: 849 },
  { id: "p034", seller: "Elite Gaming Distribution", trustScore: 52, price: 1299 },
  { id: "p035", seller: "Cloudtail India", trustScore: 91, price: 3699 },
  { id: "p036", seller: "Samsung India Electronics", trustScore: 89, price: 13999 },
  { id: "p037", seller: "Amazon", trustScore: 94, price: 4499 },
  { id: "p038", seller: "Wipro Consumer Lighting", trustScore: 76, price: 899 },
];

// ── Probability helpers (used for synthetic data generation only) ─────────────
function returnProb(trustScore, customerMultiplier = 1.0) {
  const base = trustScore >= 90 ? 0.04
    : trustScore >= 82 ? 0.08
      : trustScore >= 72 ? 0.13
        : trustScore >= 60 ? 0.20
          : 0.29;
  return Math.min(0.55, base * customerMultiplier);
}

function reorderProb(trustScore, customerMultiplier = 1.0) {
  const base = trustScore >= 90 ? 0.40
    : trustScore >= 82 ? 0.31
      : trustScore >= 72 ? 0.23
        : trustScore >= 60 ? 0.15
          : 0.08;
  return Math.min(0.65, base * customerMultiplier);
}

function generateRating(trustScore, returned, r) {
  if (returned) {
    if (trustScore >= 80) return r < 0.25 ? 1 : r < 0.60 ? 2 : 3;
    if (trustScore >= 65) return r < 0.40 ? 1 : r < 0.75 ? 2 : 3;
    return r < 0.55 ? 1 : r < 0.85 ? 2 : 3;
  }
  if (trustScore >= 90) return r < 0.65 ? 5 : r < 0.92 ? 4 : 3;
  if (trustScore >= 80) return r < 0.45 ? 5 : r < 0.82 ? 4 : r < 0.95 ? 3 : 2;
  if (trustScore >= 70) return r < 0.28 ? 5 : r < 0.65 ? 4 : r < 0.88 ? 3 : 2;
  if (trustScore >= 60) return r < 0.15 ? 5 : r < 0.42 ? 4 : r < 0.73 ? 3 : r < 0.93 ? 2 : 1;
  return r < 0.07 ? 5 : r < 0.22 ? 4 : r < 0.50 ? 3 : r < 0.80 ? 2 : 1;
}

// ── Order generation ──────────────────────────────────────────────────────────
function generateOrders(custIdx, returnMult, reorderMult) {
  return PRODUCT_META.filter((p) => {
    const pn = parseInt(p.id.replace("p", ""));
    return sr(custIdx, pn, 7) < 0.46;
  }).map((p) => {
    const pn = parseInt(p.id.replace("p", ""));
    const ret = sr(custIdx + 500, pn) < returnProb(p.trustScore, returnMult);
    const reorder = !ret && sr(custIdx + 1000, pn) < reorderProb(p.trustScore, reorderMult);
    const reviewed = sr(custIdx + 1500, pn) < 0.62;
    const baseRating = generateRating(p.trustScore, ret, sr(custIdx + 2000, pn));
    const yearOffset = Math.floor(sr(custIdx + 3000, pn) * 5);
    const monthNum = Math.floor(sr(custIdx + 4000, pn) * 12) + 1;
    const month = String(monthNum).padStart(2, "0");
    const day = Math.floor(sr(custIdx + 6000, pn) * 28) + 1;

    let reviewTitle = null, reviewBody = null, reviewDate = null;
    if (reviewed) {
      const tpls = REVIEW_TEMPLATES[baseRating] || REVIEW_TEMPLATES[3];
      const t = tpls[Math.floor(sr(custIdx + 7000, pn) * tpls.length)];
      reviewTitle = t.title;
      reviewBody = t.body;
      reviewDate = `${day} ${MONTH_NAMES[monthNum - 1]} ${2022 + yearOffset}`;
    }

    return {
      productId: p.id,
      seller: p.seller,
      amount: p.price,
      orderedAt: `${2022 + yearOffset}-${month}`,
      returned: ret,
      returnReason: ret ? RETURN_REASONS[Math.floor(sr(custIdx + 5000, pn) * RETURN_REASONS.length)] : null,
      reordered: reorder,
      reviewed,
      rating: reviewed ? baseRating : null,
      reviewTitle,
      reviewBody,
      reviewDate,
    };
  });
}

// ── Customer generation ───────────────────────────────────────────────────────
export const customers = Array.from({ length: 200 }, (_, idx) => {
  const i = idx + 1;

  const firstName = FIRST_NAMES[Math.floor(sr(i, 1) * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(sr(i, 2) * LAST_NAMES.length)];
  const city = CITIES[Math.floor(sr(i, 3) * CITIES.length)];
  const memberYear = 2018 + Math.floor(sr(i, 4) * 6);

  const typeRoll = sr(i, 99);
  const returnMult = typeRoll < 0.20 ? 0.40 : typeRoll > 0.80 ? 2.10 : 1.00;
  const reorderMult = typeRoll < 0.20 ? 1.40 : typeRoll > 0.80 ? 0.55 : 1.00;

  const orders = generateOrders(i, returnMult, reorderMult);
  const totalOrders = orders.length;
  const returned = orders.filter((o) => o.returned);
  const reordered = orders.filter((o) => o.reordered);
  const reviewed = orders.filter((o) => o.reviewed && o.rating != null);

  return {
    id: `cust_${String(i).padStart(3, "0")}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
    phone: `+91 ${String(Math.floor(sr(i, 7) * 9000000000 + 1000000000)).slice(0, 10)}`,
    city,
    state: STATE_MAP[city] || "Karnataka",
    memberSince: String(memberYear),
    totalOrders,
    totalSpent: orders.reduce((sum, o) => sum + o.amount, 0),
    returnRate: totalOrders ? parseFloat((returned.length / totalOrders).toFixed(3)) : 0,
    reorderRate: totalOrders ? parseFloat((reordered.length / totalOrders).toFixed(3)) : 0,
    avgRating: reviewed.length
      ? parseFloat((reviewed.reduce((s, o) => s + o.rating, 0) / reviewed.length).toFixed(2))
      : null,
    orders,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// TRUSTLENS CORE — per-product metrics computed from real customer behaviour
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getProductReturnRate
 * ─────────────────────────────────────────────────────────────────────────────
 * Metric: what percentage of customers who bought this product returned it?
 *
 * Method (customer-level, not order-level):
 *   1. Find every customer who has at least one order for this productId
 *   2. A customer "returned" the product if ANY of their orders for it are returned
 *   3. returnRate = customers_who_returned / customers_who_bought
 *
 * Why customer-level?
 *   An order-level count would inflate the rate for repeat buyers who only
 *   returned one of multiple purchases. Customer-level reflects the real
 *   question: "out of the people who bought this, how many sent it back?"
 */
export function getProductReturnRate(productId) {
  const buyerIds = new Set();
  const returnerIds = new Set();

  for (const c of customers) {
    const productOrders = c.orders.filter((o) => o.productId === productId);
    if (productOrders.length === 0) continue;

    buyerIds.add(c.id);
    if (productOrders.some((o) => o.returned)) {
      returnerIds.add(c.id);
    }
  }

  const totalBuyers = buyerIds.size;
  const totalReturners = returnerIds.size;

  if (totalBuyers === 0) return { returnRate: 0, totalBuyers: 0, totalReturners: 0 };

  return {
    returnRate: parseFloat((totalReturners / totalBuyers).toFixed(3)),
    totalBuyers,
    totalReturners,
  };
}

/**
 * getProductReorderRate
 * ─────────────────────────────────────────────────────────────────────────────
 * Metric: of all purchase events for this product, what fraction were reorders?
 *
 * Method (event-level):
 *   1. Collect all order records for this productId across all customers
 *   2. reorderRate = orders_where_reordered_is_true / total_orders_for_product
 *
 * Why event-level here (not customer-level)?
 *   Reorder rate measures purchase velocity and repeat demand. A customer who
 *   bought 3 times and reordered twice contributes 3 purchase events and 2
 *   reorder events — that's meaningful signal. Customer-level would lose this.
 *
 * A reorder event only exists when returned === false (you can't reorder
 * something you sent back — enforced during generation).
 */
export function getProductReorderRate(productId) {
  const allOrders = customers.flatMap((c) =>
    c.orders.filter((o) => o.productId === productId)
  );

  const totalPurchases = allOrders.length;
  const totalReorders = allOrders.filter((o) => o.reordered).length;

  if (totalPurchases === 0) return { reorderRate: 0, totalPurchases: 0, totalReorders: 0 };

  return {
    reorderRate: parseFloat((totalReorders / totalPurchases).toFixed(3)),
    totalPurchases,
    totalReorders,
  };
}

/**
 * getProductAvgRating
 * ─────────────────────────────────────────────────────────────────────────────
 * Metric: mean star rating across all verified reviews for this product.
 *
 * Only orders where reviewed === true and rating != null are counted.
 * All reviews in this database are verified purchases (verified: true).
 */
export function getProductAvgRating(productId) {
  const ratedOrders = customers.flatMap((c) =>
    c.orders.filter((o) => o.productId === productId && o.reviewed && o.rating != null)
  );

  const totalReviews = ratedOrders.length;
  if (totalReviews === 0) return { avgRating: null, totalReviews: 0, ratingDistribution: {} };

  const sum = ratedOrders.reduce((s, o) => s + o.rating, 0);

  // Star distribution (useful for the breakdown panel)
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const o of ratedOrders) dist[o.rating]++;

  return {
    avgRating: parseFloat((sum / totalReviews).toFixed(2)),
    totalReviews,
    ratingDistribution: dist,
  };
}

/**
 * computeProductTrustScore
 * ─────────────────────────────────────────────────────────────────────────────
 * The single source of truth for TrustLens scores.
 * Calls the three functions above and combines them into a 0–100 score.
 *
 * SCORING FORMULA
 * ───────────────
 *   Component        Weight   Scale
 *   ─────────────────────────────────────────────────────────────────────────
 *   Return Rate       35 pts  returnRate 0% → 35pts, 15%+ → 0pts (linear)
 *   Reorder Rate      30 pts  reorderRate 0% → 0pts, 40%+ → 30pts (linear)
 *   Avg Rating        35 pts  rating 1★ → 0pts, 5★ → 35pts (linear)
 *
 * GUARD RAILS
 *   - Requires at least 30 buyers with rating data to produce a score.
 *     Below this threshold: { score: null, insufficient: true }
 *   - If a signal is missing (e.g. no reviews yet), its weight is
 *     redistributed proportionally across the available signals.
 *
 * GRADE LABELS
 *   80–100 → "High Trust"
 *   60–79  → "Trusted"
 *   40–59  → "Verified"
 *   0–39   → not shown (TrustLens only renders for score ≥ 40)
 */
export function computeProductTrustScore(productId) {
  const returnData = getProductReturnRate(productId);
  const reorderData = getProductReorderRate(productId);
  const ratingData = getProductAvgRating(productId);

  // Minimum data guard
  if (returnData.totalBuyers < 30 || ratingData.totalReviews < 30) {
    return {
      productId,
      score: null,
      insufficient: true,
      reason: "Not enough purchase history to compute a reliable score.",
      rawMetrics: {
        returnRate: returnData,
        reorderRate: reorderData,
        avgRating: ratingData,
      },
    };
  }

  // ── Component scores ──────────────────────────────────────────────────────

  // Return rate: 0% = perfect (35pts), 15%+ = 0pts
  // Capped so a 20% return rate doesn't go negative
  const returnScore = Math.max(
    0,
    35 * (1 - Math.min(returnData.returnRate / 0.15, 1))
  );

  // Reorder rate: 0% = 0pts, 40%+ = full 30pts
  const reorderScore = Math.min(
    30,
    30 * (reorderData.reorderRate / 0.40)
  );

  // Avg rating: 1★ = 0pts, 5★ = 35pts (linear across 4-point range)
  const reviewScore = ratingData.avgRating != null
    ? 35 * ((ratingData.avgRating - 1) / 4)
    : null;

  // If reviews are missing, redistribute their 35pts to the other two
  let finalReturnScore = returnScore;
  let finalReorderScore = reorderScore;
  let finalReviewScore = reviewScore ?? 0;

  if (reviewScore === null) {
    // Redistribute 35pts proportionally: return (35/65 = 53.8%), reorder (30/65 = 46.2%)
    finalReturnScore += 35 * (35 / 65);
    finalReorderScore += 35 * (30 / 65);
    finalReviewScore = 0;
  }

  const score = Math.round(finalReturnScore + finalReorderScore + finalReviewScore);

  const grade =
    score >= 80 ? "High Trust" :
      score >= 60 ? "Trusted" :
        score >= 40 ? "Verified" : null;

  // ── Positive-only signal framing (TrustLens rule: only send buyer-facing ──
  // ── text for signals that read as confidence-builders)                   ──
  const signals = [];

  // Reorder signal: only show if > 10% reorder rate (meaningful repeat demand)
  if (reorderData.reorderRate > 0.10) {
    signals.push({
      id: "reorder",
      icon: "RefreshCw",
      headline: `${Math.round(reorderData.reorderRate * 100)}% of buyers reorder this`,
      subtext: "Customers keep coming back",
      weight: 30,
      rawValue: reorderData.reorderRate,
    });
  }

  // Return signal: only show when return rate is low (< 12%)
  if (returnData.returnRate < 0.12) {
    signals.push({
      id: "returnRate",
      icon: "PackageCheck",
      headline: returnData.returnRate < 0.05
        ? "Under 5% return rate"
        : `Only ${Math.round(returnData.returnRate * 100)}% of customers returned this`,
      subtext: "Most customers keep this item",
      weight: 35,
      rawValue: returnData.returnRate,
    });
  }

  // Review signal: only show if avgRating >= 3.8
  if (ratingData.avgRating != null && ratingData.avgRating >= 3.8) {
    signals.push({
      id: "reviews",
      icon: "Star",
      headline: `${ratingData.avgRating} stars · ${ratingData.totalReviews} verified reviews`,
      subtext: "Based on verified purchases",
      weight: 35,
      rawValue: ratingData.avgRating,
    });
  }

  return {
    productId,
    score,
    grade,
    visible: grade !== null,   // false if score < 40 — card should not render
    signals,
    rawMetrics: {
      returnRate: returnData,
      reorderRate: reorderData,
      avgRating: ratingData,
    },
    componentScores: {
      returnScore: parseFloat(finalReturnScore.toFixed(2)),
      reorderScore: parseFloat(finalReorderScore.toFixed(2)),
      reviewScore: parseFloat(finalReviewScore.toFixed(2)),
    },
    meta: {
      dataWindow: "All-time purchase data",
      calculatedAt: new Date().toISOString(),
      minBuyersReqd: 30,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING QUERY HELPERS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export function getCustomerById(id) {
  return customers.find((c) => c.id === id) || null;
}

export function getCustomersForProduct(productId) {
  return customers.filter((c) => c.orders.some((o) => o.productId === productId));
}

export function getCustomersForSeller(sellerName) {
  return customers.filter((c) => c.orders.some((o) => o.seller === sellerName));
}

export function getSellerReturnRate(sellerName) {
  const all = customers.flatMap((c) => c.orders.filter((o) => o.seller === sellerName));
  const returned = all.filter((o) => o.returned);
  return all.length ? parseFloat((returned.length / all.length).toFixed(3)) : 0.10;
}

export function getSellerReorderRate(sellerName) {
  const all = customers.flatMap((c) => c.orders.filter((o) => o.seller === sellerName));
  const reordered = all.filter((o) => o.reordered);
  return all.length ? parseFloat((reordered.length / all.length).toFixed(3)) : 0.20;
}

export function getSellerAvgRating(sellerName) {
  const reviews = customers.flatMap((c) =>
    c.orders.filter((o) => o.seller === sellerName && o.reviewed && o.rating != null)
  );
  return reviews.length
    ? parseFloat((reviews.reduce((s, o) => s + o.rating, 0) / reviews.length).toFixed(2))
    : 4.0;
}

/** Legacy: kept for backward compatibility. Use computeProductTrustScore() for TrustLens. */
export function getProductStats(productId) {
  const all = customers.flatMap((c) => c.orders.filter((o) => o.productId === productId));
  if (!all.length) return { returnRate: 0.10, reorderRate: 0.20, avgRating: 4.0, totalBuyers: 0 };
  const reviews = all.filter((o) => o.reviewed && o.rating != null);
  return {
    totalBuyers: all.length,
    returnRate: parseFloat((all.filter((o) => o.returned).length / all.length).toFixed(3)),
    reorderRate: parseFloat((all.filter((o) => o.reordered).length / all.length).toFixed(3)),
    avgRating: reviews.length
      ? parseFloat((reviews.reduce((s, o) => s + o.rating, 0) / reviews.length).toFixed(2))
      : 4.0,
  };
}

export function addCustomer(data) {
  const id = `cust_${String(customers.length + 1).padStart(3, "0")}`;
  const fresh = {
    id, totalOrders: 0, totalSpent: 0,
    returnRate: 0, reorderRate: 0, avgRating: null, orders: [],
    ...data,
  };
  customers.push(fresh);
  return fresh;
}

export function getProductReviews(productId, page = 1, limit = 10) {
  const reviews = [];
  for (const c of customers) {
    for (const o of c.orders) {
      if (o.productId === productId && o.reviewed && o.reviewTitle) {
        reviews.push({
          customerId: c.id,
          author: c.name,
          city: c.city,
          rating: o.rating,
          title: o.reviewTitle,
          body: o.reviewBody,
          date: o.reviewDate,
          verified: true,
          returned: o.returned,
          reordered: o.reordered,
        });
      }
    }
  }
  reviews.sort((a, b) => b.date.localeCompare(a.date));
  const total = reviews.length;
  const start = (page - 1) * limit;
  return { total, page, pages: Math.ceil(total / limit), reviews: reviews.slice(start, start + limit) };
}

export function addReview({ name, email, password, productId, seller, rating, title, body }) {
  let customer = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!customer) {
    customer = addCustomer({ name, email, password, city: "India", state: "India", memberSince: String(new Date().getFullYear()) });
  }

  const alreadyReviewed = customer.orders.some((o) => o.productId === productId && o.reviewed);
  if (alreadyReviewed) return { error: "already_reviewed", customer };

  const now = new Date();
  const reviewDate = `${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const order = {
    productId, seller: seller || "",
    amount: 0, orderedAt: now.toISOString().slice(0, 7),
    returned: false, returnReason: null, reordered: false,
    reviewed: true, rating, reviewTitle: title, reviewBody: body, reviewDate,
  };
  customer.orders.push(order);
  customer.totalOrders += 1;
  const reviewed = customer.orders.filter((o) => o.reviewed && o.rating != null);
  customer.avgRating = reviewed.length
    ? parseFloat((reviewed.reduce((s, o) => s + o.rating, 0) / reviewed.length).toFixed(2))
    : null;

  return {
    customer,
    review: { customerId: customer.id, author: customer.name, city: customer.city, rating, title, body, date: reviewDate, verified: true },
  };
}

export function recordActivity(customerId, activity) {
  const c = customers.find((x) => x.id === customerId);
  if (!c) return null;

  if (activity.type === "order") {
    c.orders.push({
      productId: activity.productId, seller: activity.seller,
      amount: activity.amount, orderedAt: new Date().toISOString().slice(0, 7),
      returned: false, returnReason: null, reordered: false, reviewed: false, rating: null,
    });
    c.totalOrders++;
    c.totalSpent += activity.amount;
  } else if (activity.type === "return") {
    const o = c.orders.find((x) => x.productId === activity.productId && !x.returned);
    if (o) { o.returned = true; o.returnReason = activity.reason; }
  } else if (activity.type === "review") {
    const o = c.orders.find((x) => x.productId === activity.productId);
    if (o) { o.reviewed = true; o.rating = activity.rating; }
    const rev = c.orders.filter((x) => x.reviewed && x.rating != null);
    c.avgRating = rev.length
      ? parseFloat((rev.reduce((s, x) => s + x.rating, 0) / rev.length).toFixed(2))
      : null;
  } else if (activity.type === "reorder") {
    const o = c.orders.find((x) => x.productId === activity.productId);
    if (o) o.reordered = true;
  }

  if (c.orders.length) {
    c.returnRate = parseFloat((c.orders.filter((o) => o.returned).length / c.orders.length).toFixed(3));
    c.reorderRate = parseFloat((c.orders.filter((o) => o.reordered).length / c.orders.length).toFixed(3));
  }
  return c;
}

// ── Startup diagnostic ────────────────────────────────────────────────────────
console.log("\nTrustLens™ — computed trust scores per product (from real customer data):");
console.log("─".repeat(90));
console.log(
  "Product".padEnd(8) + "Buyers".padStart(7) + "  " +
  "Ret%".padStart(6) + "  " + "Reord%".padStart(7) + "  " +
  "Avg★".padStart(5) + "  " + "Score".padStart(6) + "  " + "Grade"
);
console.log("─".repeat(90));

for (const p of PRODUCT_META) {
  const result = computeProductTrustScore(p.id);
  if (result.insufficient) {
    console.log(
      p.id.padEnd(8) +
      String(result.rawMetrics.returnRate.totalBuyers).padStart(7) +
      "  — insufficient data —"
    );
  } else {
    const { rawMetrics: m, score, grade } = result;
    console.log(
      p.id.padEnd(8) +
      String(m.returnRate.totalBuyers).padStart(7) + "  " +
      (m.returnRate.returnRate * 100).toFixed(1).padStart(5) + "%  " +
      (m.reorderRate.reorderRate * 100).toFixed(1).padStart(6) + "%  " +
      String(m.avgRating.avgRating ?? "—").padStart(5) + "  " +
      String(score).padStart(6) + "  " +
      grade
    );
  }
}
console.log("─".repeat(90) + "\n");