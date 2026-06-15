/**
 * AmazonLens – Smart Search Route (v3)
 * Real product catalog + Groq AI bundle generation for any natural-language query.
 */

import express from 'express';
import { groqCall, PRIMARY_MODEL, FAST_MODEL } from '../utils/groqClient.js';
import { products as mockProducts } from '../data/mockData.js';
import { djProducts } from '../data/djProducts.js';

const router = express.Router();

// ─── Category normalisation ───────────────────────────────────────────────────
const CAT_MAP = [
  ['electronics > televisions',       'tv'],
  ['electronics > home audio',        'audio'],
  ['electronics > mobiles',           'phone'],
  ['electronics > headphones',        'audio'],
  ['electronics > streaming devices', 'streaming'],
  ['electronics > mobile accessories','phone_accessories'],
  ['electronics > accessories',       'phone_accessories'],
  ['electronics > smart home',        'smart_home'],
  ['electronics > lighting',          'lighting'],
  ['electronics > computers',         'computer'],
  ['computers > monitors',            'monitor'],
  ['computers > input devices',       'input_devices'],
  ['computers > accessories',         'computer_accessories'],
  // IMPORTANT: "home & kitchen" must come BEFORE bare "kitchen" — substring match order matters
  ['home & kitchen > furniture',      'furniture'],
  ['home & kitchen',                  'home'],
  ['kitchen > cookware',              'kitchen'],
  ['kitchen',                         'kitchen'],
  ['grocery',                         'grocery'],
  ['beauty',                          'beauty'],
  ['sports',                          'sports'],
  ['books',                           'books'],
  ['fashion',                         'fashion'],
];

function mapCategory(fullCategory) {
  const key = (fullCategory || '').toLowerCase();
  for (const [pattern, cat] of CAT_MAP) {
    if (key.includes(pattern)) return cat;
  }
  return key.split(' > ').pop() || 'other';
}

// ─── Real product catalogue (mockData + djProducts = 220+ products) ──────────
const ALL_SOURCE_PRODUCTS = [...mockProducts, ...djProducts];

function toCatalogEntry(p) {
  return {
    id:            p.id,
    name:          p.name,
    category:      mapCategory(p.category),
    fullCategory:  p.category,
    brand:         p.brand || '',
    price:         p.price,
    originalPrice: p.originalPrice || Math.round(p.price * 1.3),
    rating:        p.rating || 4.0,
    reviews:       p.reviewCount || 50,
    trustScore:    p.trustScore || 75,
    trustLabel:    p.trustLabel || 'Genuine',
    image:         p.thumbnail || (p.images && p.images[0]) || '',
    badge:         null,
    tags: [
      (p.brand || '').toLowerCase(),
      ...(p.category || '').toLowerCase().split(' > '),
      ...p.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
    ].filter(Boolean),
  };
}

const CATALOG = ALL_SOURCE_PRODUCTS.map(toCatalogEntry);

// ─── Full catalog text for Groq (ALL products, preferred brands first) ────────
function buildFullCatalogText(brandPrefs = []) {
  const prefSet = new Set(brandPrefs.map(b => b.brand.toLowerCase()));
  const sorted = [...CATALOG].sort((a, b) => {
    const ap = prefSet.has((a.brand || '').toLowerCase()) ? 1 : 0;
    const bp = prefSet.has((b.brand || '').toLowerCase()) ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return b.trustScore - a.trustScore;
  });
  return sorted
    .map(p => `${p.id}|${p.name}|₹${p.price}|${p.brand || '-'}|${p.category}`)
    .join('\n');
}

// ─── Setup Requirements ───────────────────────────────────────────────────────
const SETUP_REQUIREMENTS = {
  tv: {
    name: 'TV Setup', icon: '📺',
    required: ['tv'],
    optional: ['audio', 'streaming'],
    tagline: 'Complete entertainment setup for your living room',
  },
  home_theatre: {
    name: 'Home Theatre Setup', icon: '🎬',
    required: ['tv', 'audio'],
    optional: ['streaming'],
    tagline: 'Cinema-grade experience at home',
  },
  gaming: {
    name: 'Gaming Setup', icon: '🎮',
    required: ['monitor'],
    optional: ['audio', 'input_devices'],
    tagline: 'Everything you need for an immersive gaming experience',
  },
  office: {
    name: 'Office Setup', icon: '💼',
    required: ['monitor'],
    optional: ['input_devices', 'computer_accessories'],
    tagline: 'Professional workspace essentials',
  },
  phone: {
    name: 'Phone Bundle', icon: '📱',
    required: ['phone'],
    optional: ['audio', 'phone_accessories'],
    tagline: 'Complete mobile experience',
  },
  kitchen: {
    name: 'Kitchen Starter Kit', icon: '🍳',
    required: ['kitchen'],
    optional: [],
    tagline: 'Everything you need for a fully equipped kitchen',
    multiPick: 4,
  },
  smart_home: {
    name: 'Smart Home Setup', icon: '🏠',
    required: ['smart_home'],
    optional: ['lighting', 'streaming'],
    tagline: 'Transform your home into a smart living space',
  },
  fitness: {
    name: 'Fitness & Sports Bundle', icon: '🏋️',
    required: ['sports'],
    optional: ['audio'],
    tagline: 'Everything you need for your home workout',
    multiPick: 5,
  },
  streaming: {
    name: 'Streaming Setup', icon: '📡',
    required: ['streaming'],
    optional: ['audio', 'smart_home'],
    tagline: 'Your complete home entertainment streaming setup',
  },
  audio: {
    name: 'Audio Bundle', icon: '🎧',
    required: ['audio'],
    optional: [],
    tagline: 'Premium audio for every occasion',
    multiPick: 3,
  },
  beauty: {
    name: 'Beauty Bundle', icon: '💄',
    required: ['beauty'],
    optional: [],
    tagline: 'Your complete beauty and skincare routine',
    multiPick: 5,
  },
  gadget_gift: {
    name: 'Top Electronics Gift Bundle', icon: '🎁',
    required: ['audio', 'streaming'],
    optional: ['smart_home'],
    tagline: 'Best electronics picks for the tech enthusiast',
  },
};

// ─── Budget Extraction ────────────────────────────────────────────────────────
function extractBudget(query) {
  const patterns = [
    /(?:under|below|within|less\s*than|upto|up\s*to|max|budget|around)\s*(?:rs\.?|₹|inr)?\s*([\d,]+)\s*k?\b/i,
    /(?:rs\.?|₹|inr)\s*([\d,]+)\s*k?\b/i,
    /([\d,]+)\s*k\s*(?:budget|max|limit|rs\.?|₹|inr|$)/i,
    /([\d,]+)\s*(?:budget|max|limit|rs\.?|₹|inr)/i,
  ];
  for (const pat of patterns) {
    const m = query.match(pat);
    if (m) {
      let val = parseInt(m[1].replace(/,/g, ''), 10);
      if (/\d+\s*k/i.test(m[0])) val *= 1000;
      return val;
    }
  }
  return null;
}

// ─── Setup Type Detection (keyword-only, no AI call needed) ──────────────────
function detectSetupType(query) {
  const q = query.toLowerCase();
  if (/home\s*theat(re|er)|cinema\s*room/.test(q)) return 'home_theatre';
  if (/\btv\b|\btelevision\b/.test(q)) return 'tv';
  if (/gaming/.test(q)) return 'gaming';
  if (/office\s*setup|work\s*(?:from\s*home|setup)|wfh|ergonomic\s*(?:office|desk)/.test(q)) return 'office';
  if (/\blaptop\b|\bnotebook\b/.test(q)) return 'office'; // laptop → office accessories bundle
  if (/\bphone\b|\bmobile\b|\bsmartphone\b/.test(q)) return 'phone';
  if (/kitchen/.test(q)) return 'kitchen';
  if (/smart\s*home|smart\s*speaker|smart\s*bulb|voice\s*assistant/.test(q)) return 'smart_home';
  if (/\bfitness\b|\bworkout\b|\bgym\b|\bexercise\b|\bsports?\b/.test(q)) return 'fitness';
  if (/\bstreaming\b|\bentertainment\s*setup/.test(q)) return 'streaming';
  if (/\bearbuds?\b|\bheadphones?\b|\bsoundbar\b|\bwireless\s+audio\b/.test(q)) return 'audio';
  if (/\bbeauty\b|\bskincare\b|\bmakeup\b/.test(q)) return 'beauty';
  if (/\bgadget\b|gift\s+for.*(?:tech|gadget|electronic)|best\s+electronics\b/.test(q)) return 'gadget_gift';
  return null;
}

// ─── Deterministic Bundle Generation ─────────────────────────────────────────
function generateBundles(setupType, budget, brandPrefs = []) {
  const spec = SETUP_REQUIREMENTS[setupType];
  if (!spec) return [];

  const prefBrandSet = new Set(brandPrefs.map(b => b.brand.toLowerCase()));

  const allCategories = [...spec.required, ...spec.optional];
  const candidatesPerCat = {};
  for (const cat of allCategories) {
    // Top 3 per category — preferred brands sorted first, then by trust score
    candidatesPerCat[cat] = CATALOG
      .filter((p) => p.category === cat)
      .sort((a, b) => {
        const aPref = prefBrandSet.has((a.brand || '').toLowerCase()) ? 1 : 0;
        const bPref = prefBrandSet.has((b.brand || '').toLowerCase()) ? 1 : 0;
        if (bPref !== aPref) return bPref - aPref;
        return b.trustScore - a.trustScore;
      })
      .slice(0, 3);
  }

  // Check if any required category has products
  const hasRequired = spec.required.every((cat) => (candidatesPerCat[cat] || []).length > 0);
  if (!hasRequired) return [];

  const bundles = [];

  function buildCombos(catList, current = [], index = 0, isOptionalPhase = false) {
    if (index >= catList.length) {
      if (current.length === 0) return;
      const total        = current.reduce((s, p) => s + p.price, 0);
      const originalTotal = current.reduce((s, p) => s + p.originalPrice, 0);
      const avgTrust     = Math.round(current.reduce((s, p) => s + p.trustScore, 0) / current.length);
      const completeness = current.length / allCategories.length;
      bundles.push({ products: [...current], total, originalTotal, savings: originalTotal - total, avgTrust, completeness, withinBudget: budget ? total <= budget : true });
      return;
    }
    const cat = catList[index];
    const candidates = candidatesPerCat[cat] || [];
    if (isOptionalPhase) buildCombos(catList, current, index + 1, true);
    for (const product of candidates) {
      current.push(product);
      buildCombos(catList, current, index + 1, isOptionalPhase);
      current.pop();
    }
  }

  buildCombos([...spec.required, ...spec.optional], [], 0, false);
  buildCombos(spec.required, [], 0, false);
  for (let i = 0; i < spec.optional.length; i++) {
    buildCombos([...spec.required, ...spec.optional.slice(0, i + 1)], [], 0, false);
  }

  // Deduplicate
  const seen = new Set();
  return bundles.filter((b) => {
    const key = b.products.map((p) => p.id).sort().join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rankBundles(bundles, budget) {
  return bundles.sort((a, b) => {
    if (budget) {
      if (a.withinBudget && !b.withinBudget) return -1;
      if (!a.withinBudget && b.withinBudget) return 1;
      // Both within budget → prefer more complete first, then higher total (maximize spend)
      if (a.withinBudget && b.withinBudget) {
        if (b.completeness !== a.completeness) return b.completeness - a.completeness;
        return b.total - a.total;
      }
    }
    if (b.completeness !== a.completeness) return b.completeness - a.completeness;
    if (b.avgTrust !== a.avgTrust) return b.avgTrust - a.avgTrust;
    return b.total - a.total;
  });
}

function generateWhyExplanation(bundle, budget, setupType) {
  const reasons = [];
  if (budget && bundle.total <= budget) reasons.push(`Fits your ₹${budget.toLocaleString('en-IN')} budget`);
  reasons.push(`Average Trust Score: ${bundle.avgTrust}`);
  if (bundle.savings > 0) reasons.push(`Saves ₹${bundle.savings.toLocaleString('en-IN')} compared to buying separately`);
  if (budget && bundle.total <= budget * 0.9) reasons.push(`Leaves ₹${(budget - bundle.total).toLocaleString('en-IN')} budget for accessories`);
  return reasons;
}

// ─── Top-N Bundle Builder — for single/few-category setups (beauty, audio…) ───
// Instead of combinatorial selection (1 per category), picks the N best products
// across all required+optional categories. Works well for "beauty essentials",
// "audio bundle", "gift for gadget lover" etc.
function buildTopNBundle(setupType, budget, brandPrefs = []) {
  const spec = SETUP_REQUIREMENTS[setupType];
  if (!spec?.multiPick) return null;

  const prefSet = new Set(brandPrefs.map(b => b.brand.toLowerCase()));
  const allCats = new Set([...spec.required, ...spec.optional]);

  const candidates = CATALOG
    .filter(p => allCats.has(p.category))
    .sort((a, b) => {
      const ap = prefSet.has((a.brand || '').toLowerCase()) ? 1 : 0;
      const bp = prefSet.has((b.brand || '').toLowerCase()) ? 1 : 0;
      if (bp !== ap) return bp - ap;
      return b.trustScore - a.trustScore;
    });

  if (candidates.length === 0) return null;

  let selected;
  if (budget) {
    selected = [];
    let runningTotal = 0;
    for (const p of candidates) {
      if (selected.length >= spec.multiPick) break;
      if (runningTotal + p.price <= budget) {
        selected.push(p);
        runningTotal += p.price;
      }
    }
    if (selected.length === 0) selected = [candidates[0]];
  } else {
    selected = candidates.slice(0, spec.multiPick);
  }

  const total         = selected.reduce((s, p) => s + p.price, 0);
  const originalTotal = selected.reduce((s, p) => s + p.originalPrice, 0);
  const avgTrust      = Math.round(selected.reduce((s, p) => s + p.trustScore, 0) / selected.length);
  return { products: selected, total, originalTotal, savings: originalTotal - total, avgTrust, withinBudget: !budget || total <= budget };
}

// ─── Keyword Fallback Bundle — used when AI fails or returns null ─────────────
const SEARCH_STOP_WORDS = new Set([
  'for','the','to','a','an','and','or','under','over','budget','setup','my','best',
  'good','complete','with','from','buy','need','want','give','get','me','in','is',
  'are','of','up','at','by','on','its','some','more','less','about','around','max',
  'top','great','perfect','all','just','please','want','looking','find','show','give',
  'college','student','person','who','what','which','that','this','these','those',
]);

function buildKeywordFallbackBundle(query, budget) {
  const allTerms = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
  const terms = allTerms.filter(t => !SEARCH_STOP_WORDS.has(t) && !/^\d+$/.test(t));

  if (terms.length === 0) return null;

  // Require at least 2 keyword hits (or all terms if only 1 meaningful term)
  const minScore = Math.min(2, terms.length);

  const scored = CATALOG
    .map(p => {
      const haystack = [p.name, p.fullCategory, p.brand, ...p.tags].join(' ').toLowerCase();
      const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      return { ...p, _score: score };
    })
    .filter(p => p._score >= minScore && (!budget || p.price <= budget))
    .sort((a, b) => b._score - a._score || b.trustScore - a.trustScore);

  if (scored.length === 0) return null;

  // Pick up to 5, at most 2 per category to avoid duplicates
  const catCount = {};
  const selected = [];
  let total = 0;
  for (const p of scored) {
    if (selected.length >= 5) break;
    catCount[p.category] = (catCount[p.category] || 0) + 1;
    if (catCount[p.category] > 2) continue;
    if (budget && total + p.price > budget) continue;
    selected.push(p);
    total += p.price;
  }
  if (selected.length === 0) return null;

  const origTotal = selected.reduce((s, p) => s + p.originalPrice, 0);
  const avgTrust  = Math.round(selected.reduce((s, p) => s + p.trustScore, 0) / selected.length);
  return {
    id: 'keyword-bundle',
    name: 'Curated Bundle',
    icon: '🛍️',
    tagline: `Best matches for your search`,
    products: selected,
    total,
    originalTotal: origTotal,
    savings: origTotal - total,
    avgTrust,
    withinBudget: !budget || total <= budget,
    whyReasons: [`Matched your search criteria`],
  };
}

// ─── Groq AI Bundle Generator — full catalog, primary model ───────────────────
async function generateAIBundle(query, budget, brandPrefs = []) {
  if (!process.env.GROQ_API_KEY) return null;

  const minSpend   = budget ? Math.round(budget * 0.6) : null;
  const budgetStr  = budget
    ? `₹${budget.toLocaleString('en-IN')}. MANDATORY: select enough products so their SUM is between ₹${minSpend.toLocaleString('en-IN')} and ₹${budget.toLocaleString('en-IN')}. NEVER return just 1 cheap item when the budget allows a full bundle.`
    : 'No budget — pick best-quality products regardless of price. Aim for 3–5 premium picks.';

  const brandNote  = brandPrefs.length > 0
    ? `\nPreferred brands (from order history): ${brandPrefs.map(b => `${b.brand}(${b.count}x)`).join(', ')}`
    : '';

  const catalogText = buildFullCatalogText(brandPrefs);

  try {
    const completion = await groqCall({
      model: PRIMARY_MODEL,
      max_tokens: 500,
      temperature: 0.1,
      noFallback: false,
      messages: [
        {
          role: 'system',
          content: `You are a semantic product bundling engine for an Indian e-commerce site. Your job is to match any natural-language shopping query to real products from the catalog and build a coherent, value-maximizing bundle.

RULES (strictly follow all):
1. ONLY use IDs that exist in the catalog — never invent IDs or product names.
2. Understand the INTENT, not just keywords:
   - "cinema room" / "home theatre" → TV + soundbar/audio + streaming device
   - "office" / "wfh" / "work from home" → monitor + keyboard + mouse
   - "gaming" → gaming monitor + headset + peripherals (NO food/grocery)
   - "kitchen" / "cooking" → cookware, appliances (NO food, NO drinks, NO grocery)
   - "skincare" / "beauty" → beauty and personal care products
   - "gift for gadget lover" → best electronics sorted by trust score
   - "phone bundle" → smartphone + earbuds/accessories
   - "fitness" / "workout" → sports/fitness equipment + audio
3. BUDGET: SUM of all selected product prices MUST be ≤ budget.
4. BUDGET UTILIZATION: Aim to spend 60%–100% of the budget. If budget = ₹80,000, total should be ₹48,000–₹80,000. Pick higher-quality or more products to fill the budget — do NOT return a bundle worth <50% of the budget unless the catalog truly has nothing better.
5. Select 3–5 cohesive products serving the SAME use-case.
6. If no exact match, pick the closest available products from the catalog.
Respond with JSON ONLY — no markdown, no explanation outside the JSON.`,
        },
        {
          role: 'user',
          content: `Query: "${query}"
Budget: ${budgetStr}${brandNote}

Full product catalog (id|name|₹price|brand|category):
${catalogText}

Return JSON only:
{"icon":"<emoji>","title":"<bundle name ≤5 words>","tagline":"<1 sentence>","selectedIds":["id1","id2",...],"whyReasons":["reason1","reason2"]}`,
        },
      ],
    });

    const text = completion.choices[0].message.content.trim();
    const json = JSON.parse(text.replace(/```json\n?|```/g, '').trim());

    let selectedProducts = (json.selectedIds || [])
      .map(id => CATALOG.find(p => p.id === id))
      .filter(Boolean);

    if (selectedProducts.length === 0) return null;

    // Enforce budget: drop lowest-trust items until within budget
    if (budget) {
      selectedProducts.sort((a, b) => b.trustScore - a.trustScore);
      while (selectedProducts.length > 1 &&
             selectedProducts.reduce((s, p) => s + p.price, 0) > budget) {
        selectedProducts.pop();
      }
    }

    // Budget fill: if total < 60% of budget, add more products from same categories
    if (budget && selectedProducts.length < 5) {
      const usedIds  = new Set(selectedProducts.map(p => p.id));
      const usedCats = new Set(selectedProducts.map(p => p.category));
      let runningTotal = selectedProducts.reduce((s, p) => s + p.price, 0);

      const extras = CATALOG
        .filter(p => usedCats.has(p.category) && !usedIds.has(p.id))
        .sort((a, b) => b.trustScore - a.trustScore);

      for (const p of extras) {
        if (selectedProducts.length >= 5) break;
        if (runningTotal + p.price <= budget) {
          selectedProducts.push(p);
          usedIds.add(p.id);
          runningTotal += p.price;
        }
        if (runningTotal >= budget * 0.6) break;
      }
    }

    const total         = selectedProducts.reduce((s, p) => s + p.price, 0);
    const originalTotal = selectedProducts.reduce((s, p) => s + p.originalPrice, 0);
    const avgTrust      = Math.round(selectedProducts.reduce((s, p) => s + p.trustScore, 0) / selectedProducts.length);

    return {
      id:           'ai-generated',
      name:         json.title   || 'Smart Bundle',
      icon:         json.icon    || '🛍',
      tagline:      json.tagline || 'Curated for your needs',
      products:     selectedProducts,
      total,
      originalTotal,
      savings:      originalTotal - total,
      avgTrust,
      withinBudget: !budget || total <= budget,
      whyReasons:   json.whyReasons || [],
    };
  } catch (e) {
    console.warn('AI bundle generation failed:', e?.message || e);
    return null;
  }
}

// ─── Keyword Search ───────────────────────────────────────────────────────────
function keywordSearch(query, budget = null) {
  const terms = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
    .filter(t => t.length > 2 && !SEARCH_STOP_WORDS.has(t));

  if (terms.length === 0) return [];

  return CATALOG
    .map((p) => {
      const haystack = [p.name, p.fullCategory, p.brand, ...p.tags].join(' ').toLowerCase();
      const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      return { ...p, _score: score };
    })
    .filter((p) => p._score > 0 && (!budget || p.price <= budget))
    .sort((a, b) => b._score - a._score || b.trustScore - a.trustScore)
    .map(({ _score, ...p }) => p);
}

function groupByCategory(products) {
  const groups = {};
  for (const p of products) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  }
  return groups;
}

// ─── Extract brand preferences from order history ─────────────────────────────
function extractBrandPrefs(orders = []) {
  const counts = {};
  for (const order of orders) {
    for (const item of (order.items || [])) {
      if (item.brand && item.returnStatus !== 'Returned') {
        counts[item.brand] = (counts[item.brand] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([brand, count]) => ({ brand, count }));
}

// ─── POST /api/smart-search ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { query = '', orders = [] } = req.body;
  if (!query.trim()) return res.json({ results: [], bundle: null, groups: {}, parsed: null });

  const brandPrefs = extractBrandPrefs(orders);
  const budget     = extractBudget(query);
  const setupType  = detectSetupType(query);

  let bundle             = null;
  let closestAlternative = null;
  let whyReasons         = [];

  if (setupType) {
    const spec = SETUP_REQUIREMENTS[setupType];

    // ── Multi-pick path: beauty, audio, fitness, gadget_gift etc. ────────────
    if (spec?.multiPick) {
      const b = buildTopNBundle(setupType, budget, brandPrefs);
      if (b) {
        bundle     = { id: `${setupType}-dynamic`, name: spec.name, icon: spec.icon, tagline: spec.tagline, ...b };
        whyReasons = generateWhyExplanation(b, budget, setupType);
      }
    } else {
      // ── Combinatorial path: tv, gaming, office, home_theatre, phone… ───────
      const allBundles = generateBundles(setupType, budget, brandPrefs);
      const ranked     = rankBundles(allBundles, budget);

      if (budget) {
        const within = ranked.filter(b => b.withinBudget);
        if (within.length > 0) {
          const best = within[0];
          bundle     = { id: `${setupType}-dynamic`, name: spec.name, icon: spec.icon, tagline: spec.tagline, ...best, withinBudget: true };
          whyReasons = generateWhyExplanation(best, budget, setupType);
        } else {
          const closest = ranked.filter(b => !b.withinBudget).sort((a, b) => a.total - b.total)[0];
          if (closest) {
            closestAlternative = { id: `${setupType}-closest`, name: spec.name, icon: spec.icon, tagline: spec.tagline, ...closest, overBudgetBy: closest.total - budget };
          }
        }
      } else {
        if (ranked.length > 0) {
          const best = ranked[0];
          bundle     = { id: `${setupType}-dynamic`, name: spec.name, icon: spec.icon, tagline: spec.tagline, ...best, withinBudget: true };
          whyReasons = generateWhyExplanation(best, budget, setupType);
        }
      }
    }

    // Deterministic found nothing → let AI handle it with the full catalog
    if (!bundle && !closestAlternative) {
      bundle = await generateAIBundle(query, budget, brandPrefs);
      if (bundle) whyReasons = bundle.whyReasons || [];
      // AI also failed → keyword fallback
      if (!bundle) {
        bundle = buildKeywordFallbackBundle(query, budget);
        if (bundle) whyReasons = bundle.whyReasons || [];
      }
    }

  } else {
    // ── AI path: any natural-language query — Groq sees full catalog ──────────
    bundle = await generateAIBundle(query, budget, brandPrefs);
    if (bundle) whyReasons = bundle.whyReasons || [];
    // AI failed (rate limit, etc.) → keyword fallback so we ALWAYS return something
    if (!bundle) {
      bundle = buildKeywordFallbackBundle(query, budget);
      if (bundle) whyReasons = bundle.whyReasons || [];
    }
  }

  // Individual keyword results (separate from bundle, no duplication)
  const results           = keywordSearch(query, budget);
  const bundleIds         = new Set(bundle ? bundle.products.map(p => p.id) : []);
  const individualResults = results.filter(p => !bundleIds.has(p.id));
  const groups            = groupByCategory(individualResults);

  // Lightweight parsed object for the frontend QueryAnalysisCard (no Groq call)
  const parsed = {
    intent:      setupType ? 'bundle_setup' : 'keyword',
    categories:  setupType ? [setupType] : [],
    maxBudget:   budget,
    isSetupQuery: !!setupType,
    setupType:   setupType || null,
  };

  res.json({
    query, parsed, budget, setupType,
    bundle, closestAlternative, whyReasons,
    results: individualResults, groups,
    totalFound: individualResults.length + (bundle ? bundle.products.length : 0),
  });
});

// ─── GET /api/smart-search/alternatives/:category ────────────────────────────
router.get('/alternatives/:category', (req, res) => {
  const { category }  = req.params;
  const { exclude, budget } = req.query;
  const excludeIds    = exclude ? exclude.split(',') : [];
  const maxPrice      = budget ? parseInt(budget, 10) : null;

  const alternatives = CATALOG
    .filter((p) => p.category === category)
    .filter((p) => !excludeIds.includes(p.id))
    .filter((p) => !maxPrice || p.price <= maxPrice)
    .sort((a, b) => b.trustScore - a.trustScore);

  res.json(alternatives);
});

// ─── POST /api/smart-search/recalculate ──────────────────────────────────────
router.post('/recalculate', (req, res) => {
  const { productIds, budget } = req.body;
  if (!productIds || !Array.isArray(productIds)) {
    return res.status(400).json({ error: 'productIds array required' });
  }

  const products     = productIds.map((id) => CATALOG.find((p) => p.id === id)).filter(Boolean);
  const total        = products.reduce((s, p) => s + p.price, 0);
  const originalTotal = products.reduce((s, p) => s + p.originalPrice, 0);
  const avgTrust     = products.length > 0 ? Math.round(products.reduce((s, p) => s + p.trustScore, 0) / products.length) : 0;

  let budgetStatus = 'no_budget';
  if (budget) {
    if (total <= budget * 0.9)   budgetStatus = 'within';
    else if (total <= budget)     budgetStatus = 'near_limit';
    else                          budgetStatus = 'above';
  }

  res.json({ products, total, originalTotal, savings: originalTotal - total, avgTrust, budgetStatus, overBudgetBy: budget && total > budget ? total - budget : 0 });
});

// ─── GET /api/smart-search/suggest ───────────────────────────────────────────
router.get('/suggest', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q || q.length < 2) return res.json([]);

  const SUGGESTIONS = [
    'TV setup under 40000',
    'TV setup under 70000',
    'home theatre under 50000',
    'office setup under 60000',
    'gaming setup under 80000',
    'phone bundle under 80000',
    'kitchen starter kit under 5000',
    'smart home setup under 20000',
    'Sony Bravia TV',
    'Apple iPhone',
    'boAt earbuds',
    'JBL soundbar',
    'Fire TV Stick',
    'Prestige pressure cooker',
    'wireless earbuds under 2000',
    'monitor under 30000',
    'keyboard and mouse combo',
    'computer accessories bundle',
  ];

  const matches = SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  res.json(matches);
});

export default router;
