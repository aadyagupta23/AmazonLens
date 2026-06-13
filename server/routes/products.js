import { Router } from "express";
import Groq from "groq-sdk";
import { products, bundles } from "../data/mockData.js";
import { generateReviews } from "../data/reviewGenerator.js";
import { computeProductScore } from "../utils/trustFormula.js";
import { getProductReviews, getProductStats } from "../data/customers.js";

const router = Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const queryCache = new Map();

// ── Seeded pseudo-random (consistent per product ID) ──────────────────────

function sr(seed, offset = 0) {
  const x = Math.sin(seed * 9301 + offset * 49297 + 233) * 1e6;
  return x - Math.floor(x);
}

// String-keyed version for Open Library IDs like "OL66554W"
function srStr(str, offset = 0) {
  let hash = offset * 1000033;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul((hash << 5) - hash, 1) + str.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(Math.abs(hash)) * 1e6;
  return x - Math.floor(x);
}

// ── DummyJSON ─────────────────────────────────────────────────────────────

const DJ_CATEGORY_MAP = {
  smartphones: "Electronics > Mobiles",
  laptops: "Electronics > Computers",
  tablets: "Electronics > Mobiles",
  "mobile-accessories": "Electronics > Accessories",
  "kitchen-accessories": "Home & Kitchen",
  "home-decoration": "Home & Kitchen",
  furniture: "Home & Kitchen",
  lighting: "Home & Kitchen",
  groceries: "Grocery",
  beauty: "Beauty",
  fragrances: "Beauty",
  "skin-care": "Beauty",
  "sports-accessories": "Sports",
  sunglasses: "Fashion",
  "mens-shirts": "Fashion",
  "mens-shoes": "Fashion",
  "mens-watches": "Fashion",
  "womens-dresses": "Fashion",
  "womens-shoes": "Fashion",
  "womens-watches": "Fashion",
  "womens-bags": "Fashion",
  "womens-jewellery": "Fashion",
  tops: "Fashion",
};

function mapDJProduct(p) {
  const id = p.id;
  const priceINR = Math.round(p.price * 83);
  const disc = Math.min(80, Math.round(p.discountPercentage));
  const originalINR = Math.round(priceINR / Math.max(0.25, 1 - disc / 100));
  // ~12% of DummyJSON products are from suspicious/low-trust sellers
  const isSuspiciousSeller = sr(id, 22) > 0.88;
  const trust = isSuspiciousSeller
    ? Math.max(22, Math.min(52, Math.round(18 + p.rating * 5 + sr(id, 1) * 10)))
    : Math.max(55, Math.min(96, Math.round(50 + p.rating * 8 + sr(id, 1) * 12)));
  const isFakeDisc = disc > 45 && sr(id, 2) > 0.5;

  const priceHistory = Array.from({ length: 12 }, (_, i) => {
    const spike = sr(id, i + 20) > 0.78;
    return spike ? Math.round(originalINR * (0.82 + sr(id, i + 30) * 0.35)) : priceINR;
  });
  priceHistory[11] = priceINR;

  const spikePriceMonths = priceHistory
    .map((price, i) => (price > priceINR * 1.12 ? i : -1))
    .filter((i) => i >= 0);

  return {
    id: `dj${id}`,
    name: p.title,
    brand: p.brand || "Generic",
    category: DJ_CATEGORY_MAP[p.category],
    price: priceINR,
    originalPrice: originalINR,
    discount: disc,
    rating: Math.round(p.rating * 10) / 10,
    reviewCount: Math.round(200 + sr(id, 3) * 75000),
    inStock: p.stock > 0,
    isPrime: sr(id, 4) > 0.3,
    delivery: sr(id, 5) > 0.5 ? "Get it by Tomorrow, 6 PM" : "Get it by Day after Tomorrow",
    deliveryFree: true,
    trustScore: trust,
    trustLabel: trust > 75 ? "Genuine" : trust >= 50 ? "Mixed" : "Suspicious",
    isFakeDiscount: isFakeDisc,
    fakeDiscountNote: isFakeDisc ? "High discount rate — listed MRP may be aspirational" : null,
    buyNowOrWait: sr(id, 6) > 0.55 ? "buy" : "wait",
    waitReason: sr(id, 6) <= 0.55 ? "Sale expected in the next 2 weeks based on historical patterns." : null,
    spikePriceMonths,
    priceHistory,
    thumbnail: p.thumbnail,
    images: [p.thumbnail, ...(p.images || []).slice(0, 2)],
    description: p.description || "",
    features: [],
    specs: {},
    witnesses: [],
    reviews: [],
    soldBy: p.brand || "Third-party Seller",
    soldByRating: isSuspiciousSeller
      ? parseFloat((2.0 + sr(id, 7) * 0.9).toFixed(1))
      : parseFloat((3.8 + sr(id, 7) * 1.2).toFixed(1)),
    sellerSince: isSuspiciousSeller
      ? String(2021 + Math.floor(sr(id, 8) * 4))
      : String(2010 + Math.floor(sr(id, 8) * 12)),
    fulfillment: isSuspiciousSeller ? "Seller fulfilled" : (sr(id, 9) > 0.4 ? "Fulfilled by Amazon" : "Seller fulfilled"),
    trustBreakdown: {
      reviewAuthenticity: { score: Math.max(14, Math.min(96, trust + Math.round((sr(id, 11) - 0.5) * 28))), detail: null },
      returnRate:         { score: Math.max(14, Math.min(96, trust + Math.round((sr(id, 12) - 0.5) * 22))), detail: null },
      warrantyClaims:     { score: Math.max(14, Math.min(96, trust + Math.round((sr(id, 13) - 0.5) * 18))), detail: null },
      sellerReliability:  { score: Math.max(14, Math.min(96, trust + 8 + Math.round((sr(id, 14) - 0.5) * 16))), detail: null },
      priceStability:     { score: Math.max(14, Math.min(96, (isFakeDisc ? trust - 28 : trust) + Math.round((sr(id, 15) - 0.5) * 22))), detail: null },
    },
  };
}

let djCache = null;
let djFetchPromise = null;

async function getDJProducts() {
  if (djCache) return djCache;
  if (djFetchPromise) return djFetchPromise;

  djFetchPromise = fetch(
    "https://dummyjson.com/products?limit=194&select=id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail,images"
  )
    .then((r) => r.json())
    .then(({ products: dp }) => {
      djCache = dp.filter((p) => DJ_CATEGORY_MAP[p.category]).map(mapDJProduct);
      console.log(`DummyJSON: loaded ${djCache.length} products`);
      return djCache;
    })
    .catch((err) => {
      console.log("DummyJSON fetch failed:", err.message);
      djCache = [];
      return [];
    });

  return djFetchPromise;
}

// ── Open Library Books ────────────────────────────────────────────────────

const OL_SUBJECTS = [
  { slug: "fiction",          genre: "Fiction",            limit: 8 },
  { slug: "mystery",          genre: "Mystery & Thriller",  limit: 6 },
  { slug: "romance",          genre: "Romance",             limit: 6 },
  { slug: "science_fiction",  genre: "Science Fiction",     limit: 6 },
  { slug: "self_help",        genre: "Self Help",           limit: 5 },
  { slug: "biography",        genre: "Biography",           limit: 5 },
  { slug: "history",          genre: "History",             limit: 5 },
  { slug: "fantasy",          genre: "Fantasy",             limit: 6 },
  { slug: "business",         genre: "Business",            limit: 5 },
  { slug: "children",         genre: "Children's Books",    limit: 5 },
];

function mapOLBook(work, genre) {
  const rawId = work.key.replace("/works/", ""); // e.g. "OL66554W"
  const id = `ol_${rawId}`;
  const author = work.authors?.[0]?.name || "Unknown Author";
  const year = work.first_publish_year || 2000;

  const thumbnail = work.cover_id
    ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
    : `https://placehold.co/280x400/2C3E50/FFFFFF?font=montserrat&text=${encodeURIComponent(work.title?.slice(0, 18) || "Book")}`;

  const basePrice = Math.round(199 + srStr(rawId, 1) * 601);   // ₹199–₹800
  const originalPrice = Math.round(basePrice * (1.15 + srStr(rawId, 2) * 0.45));
  const discount = Math.round(((originalPrice - basePrice) / originalPrice) * 100);
  const trust = Math.max(68, Math.min(96, Math.round(76 + srStr(rawId, 3) * 18)));
  const format = srStr(rawId, 8) > 0.5 ? "Paperback" : "Hardcover";

  return {
    id,
    name: work.title,
    brand: author,
    category: "Books",
    subcategory: genre,
    price: basePrice,
    originalPrice,
    discount,
    rating: parseFloat((3.6 + srStr(rawId, 4) * 1.3).toFixed(1)),
    reviewCount: Math.round(30 + srStr(rawId, 5) * 8000),
    inStock: true,
    isPrime: srStr(rawId, 6) > 0.35,
    delivery: srStr(rawId, 7) > 0.5 ? "Get it by Tomorrow, 6 PM" : "Get it by Day after Tomorrow",
    deliveryFree: true,
    trustScore: trust,
    trustLabel: trust > 75 ? "Genuine" : "Mixed",
    isFakeDiscount: false,
    fakeDiscountNote: null,
    buyNowOrWait: "buy",
    waitReason: null,
    spikePriceMonths: [],
    priceHistory: Array.from({ length: 12 }, () => basePrice),
    thumbnail,
    images: [thumbnail],
    description: `${work.title} by ${author}. First published in ${year}. A ${genre} title with ${work.edition_count || "multiple"} editions worldwide.`,
    features: [
      `Author: ${author}`,
      `Genre: ${genre}`,
      `First published: ${year}`,
      `Format: ${format}`,
      `${work.edition_count || "Multiple"} editions available`,
    ],
    specs: {
      Author: author,
      Genre: genre,
      "First Published": String(year),
      Format: format,
      Language: "English",
    },
    witnesses: [],
    reviews: [],
    soldBy: "Amazon",
    soldByRating: 4.8,
    sellerSince: "2010",
    fulfillment: "Fulfilled by Amazon",
    trustBreakdown: {
      reviewAuthenticity: {
        score: Math.max(60, Math.min(96, trust + Math.round((srStr(rawId, 10) - 0.5) * 20))),
        detail: null,
      },
      returnRate: {
        score: Math.max(78, Math.min(97, 85 + Math.round((srStr(rawId, 11) - 0.5) * 12))),
        detail: "Books have very low return rates — customers receive exactly what is pictured.",
      },
      warrantyClaims: {
        score: 95,
        detail: "No warranty applicable for books — physical condition guaranteed on delivery.",
      },
      sellerReliability: {
        score: 93,
        detail: "Sold directly by Amazon — highest seller reliability tier.",
      },
      priceStability: {
        score: Math.max(72, Math.min(97, 84 + Math.round((srStr(rawId, 12) - 0.5) * 18))),
        detail: "Book prices are generally stable — no artificial inflation detected.",
      },
    },
  };
}

let olCache = null;
let olFetchPromise = null;

async function getBookProducts() {
  if (olCache) return olCache;
  if (olFetchPromise) return olFetchPromise;

  olFetchPromise = Promise.all(
    OL_SUBJECTS.map(({ slug, genre, limit }) =>
      fetch(`https://openlibrary.org/subjects/${slug}.json?limit=${limit}`)
        .then((r) => r.json())
        .then(({ works = [] }) =>
          works.filter((w) => w.cover_id).map((w) => mapOLBook(w, genre))
        )
        .catch(() => [])
    )
  )
    .then((batches) => {
      const seen = new Set();
      olCache = batches.flat().filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });
      console.log(`Open Library: loaded ${olCache.length} books`);
      return olCache;
    })
    .catch((err) => {
      console.log("Open Library fetch failed:", err.message);
      olCache = [];
      return [];
    });

  return olFetchPromise;
}

// Pre-fetch both at startup so first request is fast
getDJProducts();
getBookProducts();

// ── Helper: all products combined (cached with computed trust scores) ─────

let allProductsCache = null;

export function invalidateProductCache() {
  allProductsCache = null;
}

async function getAllProducts() {
  if (allProductsCache) return allProductsCache;

  const [dj, books] = await Promise.all([getDJProducts(), getBookProducts()]);
  const base = [...products, ...dj, ...books].map((p) => ({
    ...p,
    reviews: generateReviews(p, 10),
  }));

  // Score every product independently using its own return/reorder rates.
  // DummyJSON/book products with no customer data use getProductStats defaults (10% return, 20% reorder).
  allProductsCache = base.map((product) => {
    const stats  = getProductStats(product.id);
    const realRg = stats.returnRate;
    const realRi = Math.min(1, stats.reorderRate / 0.45);
    const { productScore, status: productStatus } = computeProductScore(product, 0, { Rg: realRg, Ri: realRi });
    const { total: dbReviewCount } = getProductReviews(product.id, 1, 1);
    return { ...product, productScore, productStatus, reviewCount: dbReviewCount || product.reviewCount };
  });

  console.log(`Trust scores computed for ${allProductsCache.length} products`);
  return allProductsCache;
}

// ── Routes ────────────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  const { category, limit } = req.query;
  let result = await getAllProducts();
  if (category) result = result.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
  if (limit) result = result.slice(0, parseInt(limit));
  res.json({ products: result });
});

router.get("/:id", async (req, res) => {
  const all = await getAllProducts();
  const product = all.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ product });
});

// Words that carry no product meaning and should be ignored
const STOP_WORDS = new Set([
  "the","and","for","best","good","top","buy","get","new","cheap","budget",
  "india","online","with","price","under","below","above","latest","great",
  "review","buy","shop","sale","offer","deal","rupees","rs","inr",
]);

// Score a single product against the search terms
function scoreProduct(p, terms) {
  const name = (p.name || "").toLowerCase();
  const brand = (p.brand || "").toLowerCase();
  const cat = (p.category || "").toLowerCase();
  const desc = (p.description || "").toLowerCase();

  let totalScore = 0;
  let matchCount = 0;

  for (const term of terms) {
    let termScore = 0;
    if (name === term)                         termScore = 14;
    else if (name.startsWith(term + " "))      termScore = 11;
    else if (name.includes(" " + term + " "))  termScore = 9;
    else if (name.includes(term))              termScore = 7;
    else if (brand === term)                   termScore = 6;
    else if (brand.includes(term))             termScore = 4;
    else if (cat.includes(term))               termScore = 3;
    else if (desc.includes(term))              termScore = 1;

    if (termScore > 0) matchCount++;
    totalScore += termScore;
  }

  return { score: totalScore, matchCount };
}

const BUNDLE_DETECTION_PROMPT = `You are a search intent classifier. Given a search query, respond ONLY with valid JSON, no markdown, no explanation:
{ "type": "bundle" | "product", "category": "home theatre" | "audio" | "mobile" | null }

Rules:
- "bundle" if the query implies buying multiple complementary products together (e.g. "home theatre setup", "gaming setup", "office desk setup")
- "product" for everything else`;

router.post("/search", async (req, res) => {
  const { query } = req.body;
  const allProducts = await getAllProducts();

  if (!query) return res.json({ type: "product", products: allProducts });

  const q = query.toLowerCase().trim();

  // Bundle detection (hardcoded patterns first, AI fallback if key present)
  const bundleKeywords = ["setup", "combo", "kit", "bundle", "package", "system"];
  const homeTheatreKeywords = ["home theatre", "home theater", "theatre", "theater"];
  const isHomeTheatre = homeTheatreKeywords.some((k) => q.includes(k));
  const hasBundle = bundleKeywords.some((k) => q.includes(k));

  if (isHomeTheatre || (hasBundle && (q.includes("tv") || q.includes("sound") || q.includes("audio")))) {
    const bundle = bundles[0];
    const bundleProducts = products.filter((p) => bundle.products.includes(p.id));
    const relevant = allProducts.filter(
      (p) =>
        p.category.includes("Televisio") ||
        p.category.includes("Audio") ||
        p.category.includes("Streaming")
    );
    return res.json({ type: "bundle", bundle, products: relevant, bundleProducts });
  }

  if (groq && !queryCache.has(q)) {
    try {
      const chat = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: BUNDLE_DETECTION_PROMPT },
          { role: "user", content: query },
        ],
        max_tokens: 80,
        temperature: 0,
      });
      const raw = chat.choices[0].message.content.trim();
      queryCache.set(q, JSON.parse(raw));
    } catch {
      queryCache.set(q, { type: "product", category: null });
    }
  }

  const classification = queryCache.get(q) || { type: "product" };
  if (classification.type === "bundle") {
    const bundle = bundles[0];
    const bundleProducts = products.filter((p) => bundle.products.includes(p.id));
    return res.json({ type: "bundle", bundle, products: allProducts, bundleProducts });
  }

  // Tokenise — keep terms ≥ 1 char, drop stop words
  const terms = q
    .split(/\s+/)
    .map((t) => t.replace(/[₹,]/g, ""))   // strip currency symbols / commas
    .filter((t) => t.length >= 1 && !STOP_WORDS.has(t));

  if (terms.length === 0) {
    return res.json({ type: "product", products: allProducts });
  }

  // Score every product
  const scored = allProducts
    .map((p) => ({ product: p, ...scoreProduct(p, terms) }))
    .filter(({ matchCount }) => matchCount > 0);

  // Prefer AND results (every term matched); fall back to OR if needed
  const andMatches = scored.filter(({ matchCount }) => matchCount === terms.length);
  const results = andMatches.length > 0 ? andMatches : scored;

  // Sort by relevance score descending
  results.sort((a, b) => b.score - a.score);

  res.json({ type: "product", products: results.map((r) => r.product) });
});

export { getAllProducts };
export default router;
