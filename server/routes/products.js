import { Router } from "express";
import Groq from "groq-sdk";
import { products, bundles } from "../data/mockData.js";
import { djProducts } from "../data/djProducts.js";
import { generateReviews } from "../data/reviewGenerator.js";
import { computeProductScore } from "../utils/trustFormula.js";
import { getProductStats, computeProductTrustScore } from "../data/customers.js";

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

// DummyJSON products are now static — imported from djProducts.js
// (previously fetched from https://dummyjson.com/products at runtime)

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

// Pre-fetch books at startup so first request is fast
getBookProducts();

// ── Helper: all products combined (cached with computed trust scores) ─────

let allProductsCache = null;

export function invalidateProductCache() {
  allProductsCache = null;
}

async function getAllProducts() {
  if (allProductsCache) return allProductsCache;

  const books = await getBookProducts();
  const base = [...products, ...djProducts, ...books].map((p) => ({
    ...p,
    // Keep real 50-review arrays from mockData; only generate for external products that have none
    reviews: (p.reviews && p.reviews.length > 0) ? p.reviews : generateReviews(p, 50),
  }));

  // Score every product and stamp real reviewCount + rating from customers.js data.
  allProductsCache = base.map((product) => {
    const trust = computeProductTrustScore(product.id);
    let productScore, reviewCount, rating;

    if (!trust.insufficient) {
      // Real customer data available — use it for everything
      productScore = Math.round(
        trust.componentScores.returnScore +
        trust.componentScores.reorderScore +
        trust.componentScores.reviewScore
      );
      reviewCount = trust.rawMetrics.avgRating.totalReviews;
      rating      = trust.rawMetrics.avgRating.avgRating;
    } else {
      // External product (DummyJSON/books) — fallback score, use generated review array for count/rating
      const s = getProductStats(product.id);
      const { productScore: ps } = computeProductScore(product, 0, {
        Rg: s.returnRate, Ri: Math.min(1, s.reorderRate / 0.45), avgRating: s.avgRating,
      });
      productScore = ps;
      // Compute real stats from generated reviews array
      const revs = product.reviews || [];
      reviewCount = revs.length;
      rating = revs.length > 0
        ? parseFloat((revs.reduce((sum, r) => sum + r.rating, 0) / revs.length).toFixed(2))
        : product.rating;
    }

    const productStatus = productScore >= 75 ? "VERIFIED" : "TRUSTED";
    return { ...product, productScore, productStatus, reviewCount, rating };
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
