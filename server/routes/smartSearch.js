/**
 * AmazonLens – Smart Search Route (v2)
 * Implements: budget-hard-constraint bundles, dynamic bundle generation,
 * swap alternatives, closest-alternative fallback, why-this-bundle explanations.
 */

import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();

// ─── Product Catalogue ────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'p001',
    name: 'Sony Bravia 55" 4K TV',
    category: 'tv',
    tags: ['television', 'tv', '4k', 'sony', 'smart tv', 'display', 'screen'],
    price: 62990,
    originalPrice: 79990,
    rating: 4.3,
    reviews: 1247,
    trustScore: 71,
    trustLabel: 'Mixed',
    image: 'https://m.media-amazon.com/images/I/71ZSRbBgngL._AC_UY218_.jpg',
    badge: 'Fake Discount Detected',
    badgeColor: 'red',
  },
  {
    id: 'p002',
    name: 'JBL Cinema SB271 Soundbar',
    category: 'audio',
    tags: ['soundbar', 'audio', 'jbl', 'speaker', 'home theatre', 'theater', 'surround'],
    price: 12999,
    originalPrice: 16999,
    rating: 4.4,
    reviews: 834,
    trustScore: 83,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/61DnXxmX2OL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p003',
    name: 'Apple iPhone 15 128GB',
    category: 'phone',
    tags: ['iphone', 'apple', 'smartphone', 'mobile', 'phone', '5g'],
    price: 69999,
    originalPrice: 79900,
    rating: 4.7,
    reviews: 5420,
    trustScore: 91,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/61cwywLpR-L._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p004',
    name: 'boAt Airdopes 141 Earbuds',
    category: 'audio',
    tags: ['earbuds', 'tws', 'wireless', 'boat', 'audio', 'headphones'],
    price: 999,
    originalPrice: 2990,
    rating: 3.9,
    reviews: 9801,
    trustScore: 48,
    trustLabel: 'Suspicious',
    image: 'https://m.media-amazon.com/images/I/71jZ6DPNPNL._AC_UY218_.jpg',
    badge: 'Review Manipulation Suspected',
    badgeColor: 'orange',
  },
  {
    id: 'p005',
    name: 'Nescafé Gold Blend 200g',
    category: 'grocery',
    tags: ['coffee', 'nescafe', 'instant', 'beverage', 'grocery'],
    price: 899,
    originalPrice: 1050,
    rating: 4.5,
    reviews: 2310,
    trustScore: 88,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/61AcmNhfVzL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p006',
    name: 'Samsung 43" Crystal 4K TV',
    category: 'tv',
    tags: ['television', 'tv', '4k', 'samsung', 'smart tv', 'display', 'screen'],
    price: 27990,
    originalPrice: 42900,
    rating: 4.2,
    reviews: 892,
    trustScore: 79,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/71J4tGFH2lL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p007',
    name: 'Prestige Pressure Cooker 5L',
    category: 'kitchen',
    tags: ['cooker', 'pressure cooker', 'prestige', 'kitchen', 'cookware'],
    price: 1299,
    originalPrice: 1699,
    rating: 4.6,
    reviews: 3780,
    trustScore: 86,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/81c8JK2VTSL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p008',
    name: 'Fire TV Stick 4K Max',
    category: 'streaming',
    tags: ['firestick', 'fire tv', 'streaming', 'amazon', 'smart tv', 'stick', 'hdmi', 'dongle'],
    price: 6499,
    originalPrice: 7999,
    rating: 4.6,
    reviews: 3201,
    trustScore: 92,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/41t1bj7F5GL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p009',
    name: 'AmazonBasics HDMI 2.1 Cable 2m',
    category: 'cable',
    tags: ['hdmi', 'cable', 'wire', 'tv setup', 'accessories', 'amazonbasics'],
    price: 499,
    originalPrice: 799,
    rating: 4.3,
    reviews: 7240,
    trustScore: 90,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/31hRiS8x4nL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p010',
    name: 'Sony HT-S20R 5.1 Soundbar with Rear Speakers',
    category: 'audio',
    tags: ['soundbar', 'audio', 'sony', 'surround sound', 'home theatre', '5.1', 'speaker'],
    price: 18990,
    originalPrice: 24990,
    rating: 4.4,
    reviews: 512,
    trustScore: 85,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/71z34iDSVAL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p011',
    name: 'Mi 32" HD Ready Smart TV',
    category: 'tv',
    tags: ['television', 'tv', 'mi', 'xiaomi', 'smart tv', '32 inch', 'budget'],
    price: 12499,
    originalPrice: 17999,
    rating: 4.1,
    reviews: 3420,
    trustScore: 76,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/71XXXM8LKIL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p012',
    name: 'boAt Aavante Bar 1250 Soundbar',
    category: 'audio',
    tags: ['soundbar', 'audio', 'boat', 'speaker', 'budget', 'home theatre'],
    price: 3499,
    originalPrice: 6999,
    rating: 4.0,
    reviews: 2180,
    trustScore: 72,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/61Ue3oVMXPL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p013',
    name: 'Amazon Fire TV Stick Lite',
    category: 'streaming',
    tags: ['firestick', 'fire tv', 'streaming', 'amazon', 'budget', 'stick', 'lite'],
    price: 2499,
    originalPrice: 3999,
    rating: 4.4,
    reviews: 5600,
    trustScore: 89,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/41GMLErPZmL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p014',
    name: 'Zebronics Zeb-Juke Bar 3800 Pro',
    category: 'audio',
    tags: ['soundbar', 'audio', 'zebronics', 'budget', 'speaker'],
    price: 2799,
    originalPrice: 5999,
    rating: 3.8,
    reviews: 1890,
    trustScore: 65,
    trustLabel: 'Mixed',
    image: 'https://m.media-amazon.com/images/I/61Km0MiJIRL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p015',
    name: 'CableCreation HDMI 2.0 Cable 1.5m',
    category: 'cable',
    tags: ['hdmi', 'cable', 'wire', 'accessories', 'budget'],
    price: 299,
    originalPrice: 599,
    rating: 4.1,
    reviews: 3200,
    trustScore: 82,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/51kP2FjEYdL._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p016',
    name: 'TCL 32" HD Ready Smart TV',
    category: 'tv',
    tags: ['television', 'tv', 'tcl', 'smart tv', '32 inch', 'budget', 'hd'],
    price: 10990,
    originalPrice: 15990,
    rating: 4.0,
    reviews: 1820,
    trustScore: 74,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/71zSWRsOKML._AC_UY218_.jpg',
    badge: null,
  },
  {
    id: 'p017',
    name: 'Samsung 32" HD Smart TV',
    category: 'tv',
    tags: ['television', 'tv', 'samsung', 'smart tv', '32 inch', 'hd'],
    price: 14990,
    originalPrice: 19900,
    rating: 4.3,
    reviews: 2100,
    trustScore: 82,
    trustLabel: 'Genuine',
    image: 'https://m.media-amazon.com/images/I/71J4tGFH2lL._AC_UY218_.jpg',
    badge: null,
  },
];

// ─── Setup Category Requirements ─────────────────────────────────────────────
// Each setup type defines required and optional categories
const SETUP_REQUIREMENTS = {
  tv: {
    name: 'TV Setup',
    icon: '📺',
    required: ['tv'],
    optional: ['audio', 'streaming', 'cable'],
    tagline: 'Complete entertainment setup for your living room',
  },
  gaming: {
    name: 'Gaming Setup',
    icon: '🎮',
    required: ['monitor'],
    optional: ['audio', 'keyboard', 'mouse', 'headset'],
    tagline: 'Everything you need for an immersive gaming experience',
  },
  home_theatre: {
    name: 'Home Theatre Setup',
    icon: '🎬',
    required: ['tv', 'audio'],
    optional: ['streaming', 'cable'],
    tagline: 'Cinema-grade experience at home',
  },
  office: {
    name: 'Office Setup',
    icon: '💼',
    required: ['monitor'],
    optional: ['keyboard', 'mouse', 'cable'],
    tagline: 'Professional workspace essentials',
  },
};

// ─── Groq client ─────────────────────────────────────────────────────────────
let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch (_) {}

// ─── AI Query Parser ─────────────────────────────────────────────────────────
async function parseQueryWithAI(query) {
  if (!groq) return null;
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      max_tokens: 256,
      messages: [
        {
          role: 'system',
          content: `You are a product search parser for an Indian e-commerce site.
Given a user search query, extract structured intent as JSON (no markdown).
Fields:
- intent: "bundle_setup" | "single_product" | "category_browse" | "keyword"
- categories: string[] – product categories needed. Valid: tv, audio, streaming, phone, kitchen, grocery, cable
- maxBudget: number | null – total budget in INR, null if not mentioned
- keywords: string[] – important nouns/brands from the query
- isSetupQuery: boolean – true if user wants a complete setup/bundle
- setupType: "tv" | "gaming" | "home_theatre" | "office" | null – the type of setup requested
- bundleHint: string | null – short label like "tv setup" or "home theatre"

Only output valid JSON, nothing else.`,
        },
        { role: 'user', content: query },
      ],
    });
    const text = completion.choices[0].message.content.trim();
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
    return null;
  }
}

// ─── Budget Extraction ───────────────────────────────────────────────────────
function extractBudget(query) {
  const patterns = [
    /(?:under|below|within|less\s*than|upto|up\s*to|max|budget|around)\s*(?:rs\.?|₹|inr)?\s*([\d,]+)/i,
    /(?:rs\.?|₹|inr)\s*([\d,]+)\s*(?:budget|max|limit)?/i,
    /([\d,]+)\s*(?:budget|max|limit|rs\.?|₹|inr)/i,
  ];
  for (const pat of patterns) {
    const m = query.match(pat);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  }
  return null;
}

// ─── Detect Setup Type from Query ────────────────────────────────────────────
function detectSetupType(query, parsed) {
  if (parsed?.setupType && SETUP_REQUIREMENTS[parsed.setupType]) {
    return parsed.setupType;
  }
  const q = query.toLowerCase();
  if (/home\s*theat(re|er)/.test(q)) return 'home_theatre';
  if (/tv\s*setup|television\s*setup|tv\s*bundle/.test(q)) return 'tv';
  if (/gaming\s*setup/.test(q)) return 'gaming';
  if (/office\s*setup|work\s*from\s*home/.test(q)) return 'office';
  if (parsed?.isSetupQuery) return 'tv'; // default setup type
  return null;
}

// ─── Dynamic Bundle Generator ────────────────────────────────────────────────
/**
 * Generates all valid bundle combinations for a setup type.
 * Picks best product per category slot, generates combos, ranks them.
 */
function generateBundles(setupType, budget) {
  const spec = SETUP_REQUIREMENTS[setupType];
  if (!spec) return [];

  const allCategories = [...spec.required, ...spec.optional];

  // Get candidate products per category
  const candidatesPerCat = {};
  for (const cat of allCategories) {
    candidatesPerCat[cat] = PRODUCTS
      .filter((p) => p.category === cat)
      .sort((a, b) => b.trustScore - a.trustScore);
  }

  const bundles = [];

  function buildCombos(catList, current = [], index = 0, isOptionalPhase = false) {
    if (index >= catList.length) {
     
      if (current.length === 0) return;
      const total = current.reduce((s, p) => s + p.price, 0);
      const originalTotal = current.reduce((s, p) => s + p.originalPrice, 0);
      const avgTrust = Math.round(current.reduce((s, p) => s + p.trustScore, 0) / current.length);
      const completeness = current.length / allCategories.length;

      bundles.push({
        products: [...current],
        total,
        originalTotal,
        savings: originalTotal - total,
        avgTrust,
        completeness,
        withinBudget: budget ? total <= budget : true,
      });
      return;
    }

    const cat = catList[index];
    const candidates = candidatesPerCat[cat] || [];

    if (isOptionalPhase) {
      buildCombos(catList, current, index + 1, true);
    }

    for (const product of candidates) {
      current.push(product);
      buildCombos(catList, current, index + 1, isOptionalPhase);
      current.pop();
    }
  }

  // Build with required categories first
  const requiredCandidates = spec.required.flatMap((cat) => candidatesPerCat[cat] || []);
  if (requiredCandidates.length === 0) return [];

  //optional bundles
  buildCombos([...spec.required, ...spec.optional], [], 0, false);

  buildCombos(spec.required, [], 0, false);

  for (let i = 0; i < spec.optional.length; i++) {
    buildCombos([...spec.required, ...spec.optional.slice(0, i + 1)], [], 0, false);
  }

  // Deduplicate by product ID set
  const seen = new Set();
  const unique = bundles.filter((b) => {
    const key = b.products.map((p) => p.id).sort().join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}

/**
 * Rank bundles by: budget fit > completeness > trust > savings > price efficiency
 */
function rankBundles(bundles, budget) {
  return bundles.sort((a, b) => {
  
    if (budget) {
      if (a.withinBudget && !b.withinBudget) return -1;
      if (!a.withinBudget && b.withinBudget) return 1;
    }
    
    if (b.completeness !== a.completeness) return b.completeness - a.completeness;
    
    if (b.avgTrust !== a.avgTrust) return b.avgTrust - a.avgTrust;
    
    if (b.savings !== a.savings) return b.savings - a.savings;
    
    return a.total - b.total;
  });
}

/**
 * Generate "Why this bundle?" explanation
 */
function generateWhyExplanation(bundle, budget, setupType) {
  const reasons = [];
  const spec = SETUP_REQUIREMENTS[setupType];

  if (budget && bundle.total <= budget) {
    reasons.push(`Fits your ₹${budget.toLocaleString('en-IN')} budget`);
  }
  reasons.push(`Average Trust Score: ${bundle.avgTrust}`);
  if (bundle.savings > 0) {
    reasons.push(`Saves ₹${bundle.savings.toLocaleString('en-IN')} compared to buying separately`);
  }
  if (budget && bundle.total <= budget * 0.9) {
    reasons.push(`Leaves ₹${(budget - bundle.total).toLocaleString('en-IN')} in your budget for future upgrades`);
  }
  return reasons;
}

// ─── Keyword Search ──────────────────────────────────────────────────────────
function keywordSearch(query, budget = null) {
  const terms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const scored = PRODUCTS.map((p) => {
    const haystack = [p.name, p.category, ...p.tags].join(' ').toLowerCase();
    const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
    return { ...p, _score: score };
  })
    .filter((p) => p._score > 0)
    .filter((p) => (budget ? p.price <= budget : true))
    .sort((a, b) => b._score - a._score || b.trustScore - a.trustScore);

  return scored;
}

/** Group products by category */
function groupByCategory(products) {
  const groups = {};
  for (const p of products) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  }
  return groups;
}

// ─── POST /api/smart-search ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { query = '' } = req.body;
  if (!query.trim()) return res.json({ results: [], bundle: null, groups: {}, parsed: null });

  // 1. AI parse
  const parsed = await parseQueryWithAI(query);

  // 2. Extract budget (hard constraint)
  const budget = parsed?.maxBudget ?? extractBudget(query);

  // 3. Detect setup type
  const setupType = detectSetupType(query, parsed);

  // 4. Generate and rank bundles
  let bundle = null;
  let closestAlternative = null;
  let whyReasons = [];

  if (setupType) {
    const allBundles = generateBundles(setupType, budget);
    const ranked = rankBundles(allBundles, budget);

    if (budget) {
      const withinBudget = ranked.filter((b) => b.withinBudget);
      if (withinBudget.length > 0) {
        // Best bundle within budget
        const best = withinBudget[0];
        const spec = SETUP_REQUIREMENTS[setupType];
        bundle = {
          id: `${setupType}-dynamic`,
          name: spec.name + ' Bundle',
          icon: spec.icon,
          tagline: spec.tagline,
          products: best.products,
          total: best.total,
          originalTotal: best.originalTotal,
          savings: best.savings,
          avgTrust: best.avgTrust,
          completeness: best.completeness,
          withinBudget: true,
        };
        whyReasons = generateWhyExplanation(best, budget, setupType);
      } else {
        // No bundle fits budget – find closest alternative
        const overBudget = ranked.filter((b) => !b.withinBudget);
        if (overBudget.length > 0) {
          // Sort by how close to budget (least over)
          overBudget.sort((a, b) => a.total - b.total);
          const closest = overBudget[0];
          const spec = SETUP_REQUIREMENTS[setupType];
          closestAlternative = {
            id: `${setupType}-closest`,
            name: spec.name + ' Bundle',
            icon: spec.icon,
            tagline: spec.tagline,
            products: closest.products,
            total: closest.total,
            originalTotal: closest.originalTotal,
            savings: closest.savings,
            avgTrust: closest.avgTrust,
            completeness: closest.completeness,
            overBudgetBy: closest.total - budget,
            withinBudget: false,
          };
        }
      }
    } else {
      
      if (ranked.length > 0) {
        const best = ranked[0];
        const spec = SETUP_REQUIREMENTS[setupType];
        bundle = {
          id: `${setupType}-dynamic`,
          name: spec.name + ' Bundle',
          icon: spec.icon,
          tagline: spec.tagline,
          products: best.products,
          total: best.total,
          originalTotal: best.originalTotal,
          savings: best.savings,
          avgTrust: best.avgTrust,
          completeness: best.completeness,
          withinBudget: true,
        };
        whyReasons = generateWhyExplanation(best, budget, setupType);
      }
    }
  }

  // 5. Individual results (filtered by budget)
  let results;
  if (parsed?.categories?.length) {
    const catMatched = PRODUCTS.filter(
      (p) =>
        parsed.categories.includes(p.category) ||
        (parsed.keywords || []).some((k) =>
          [p.name, ...p.tags].join(' ').toLowerCase().includes(k.toLowerCase())
        )
    ).filter((p) => (budget ? p.price <= budget : true));
    catMatched.sort((a, b) => b.trustScore - a.trustScore);
    results = catMatched.length ? catMatched : keywordSearch(query, budget);
  } else {
    results = keywordSearch(query, budget);
  }

  // 6. Remove bundle products from individual results
  const bundleIds = new Set(bundle ? bundle.products.map((p) => p.id) : []);
  const individualResults = results.filter((p) => !bundleIds.has(p.id));

  // 7. Group by category
  const groups = groupByCategory(individualResults);

  res.json({
    query,
    parsed,
    budget,
    setupType,
    bundle,
    closestAlternative,
    whyReasons,
    results: individualResults,
    groups,
    totalFound: individualResults.length + (bundle ? bundle.products.length : 0),
  });
});

// ─── GET /api/smart-search/alternatives/:category ────────────────────────────
// Returns alternative products for a given category (used by swap feature)
router.get('/alternatives/:category', (req, res) => {
  const { category } = req.params;
  const { exclude, budget } = req.query;
  const excludeIds = exclude ? exclude.split(',') : [];
  const maxPrice = budget ? parseInt(budget, 10) : null;

  const alternatives = PRODUCTS
    .filter((p) => p.category === category)
    .filter((p) => !excludeIds.includes(p.id))
    .filter((p) => (maxPrice ? p.price <= maxPrice : true))
    .sort((a, b) => b.trustScore - a.trustScore);

  res.json(alternatives);
});

// ─── POST /api/smart-search/recalculate ──────────────────────────────────────
// Recalculates bundle metrics after a swap
router.post('/recalculate', (req, res) => {
  const { productIds, budget } = req.body;
  if (!productIds || !Array.isArray(productIds)) {
    return res.status(400).json({ error: 'productIds array required' });
  }

  const products = productIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  const total = products.reduce((s, p) => s + p.price, 0);
  const originalTotal = products.reduce((s, p) => s + p.originalPrice, 0);
  const avgTrust = products.length > 0
    ? Math.round(products.reduce((s, p) => s + p.trustScore, 0) / products.length)
    : 0;

  let budgetStatus = 'no_budget';
  if (budget) {
    if (total <= budget * 0.9) budgetStatus = 'within';
    else if (total <= budget) budgetStatus = 'near_limit';
    else budgetStatus = 'above';
  }

  res.json({
    products,
    total,
    originalTotal,
    savings: originalTotal - total,
    avgTrust,
    budgetStatus,
    overBudgetBy: budget && total > budget ? total - budget : 0,
  });
});

// ─── GET /api/smart-search/suggest ───────────────────────────────────────────
router.get('/suggest', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q || q.length < 2) return res.json([]);

  const SUGGESTIONS = [
    'TV setup under 40000',
    'TV setup under 25000',
    'home theatre under 30000',
    'best 4K TV under 50000',
    'budget soundbar',
    'Apple iPhone 15',
    'wireless earbuds under 2000',
    'pressure cooker',
    'fire tv stick',
    'Samsung TV 43 inch',
    'Sony Bravia',
    'JBL soundbar',
    'HDMI cable',
    'gaming setup under 70000',
    'office setup under 50000',
  ];

  const matches = SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  res.json(matches);
});

export default router;
