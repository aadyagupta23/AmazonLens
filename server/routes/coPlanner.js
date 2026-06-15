/**
 * AmazonLens – Co-Planner v2 (Production-Ready)
 * Shared goal shopping planner with:
 * - Invite links with expiration
 * - Roles (owner/admin/member)
 * - Expense splitting
 * - Wishlist/checklist with statuses
 * - Duplicate prevention (fuzzy matching)
 * - Activity feed
 * - Timeline planning
 * - Budget tracking (spent/planned/remaining)
 * - Plan health score
 * - Smart recommendations
 * - Archive support
 */

import { Router } from "express";
import { products } from "../data/mockData.js";
import { getAllProducts } from "./products.js";
import crypto from "crypto";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Socket.IO reference (set by server/index.js) ────────────────────────────
let io = null;
export function setIO(ioInstance) {
  io = ioInstance;
}

// ─── Groq client (lazy init) ─────────────────────────────────────────────────
let groq = null;
function getGroq() {
  if (groq) return groq;
  try {
    if (process.env.GROQ_API_KEY) {
      groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
  } catch (_) {}
  return groq;
}

// ─── Persistent store (JSON file) ────────────────────────────────────────────
const DATA_DIR = path.resolve(__dirname, "../data");
const PLANS_FILE = path.join(DATA_DIR, "coplanner-plans.json");
const INVITES_FILE = path.join(DATA_DIR, "coplanner-invites.json");

function loadStore(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return new Map(JSON.parse(raw));
    }
  } catch (_) {}
  return new Map();
}

function saveStore(map, filePath) {
  const tmp = filePath + ".tmp";
  try {
    fs.writeFileSync(tmp, JSON.stringify([...map], null, 2), "utf-8");
    fs.renameSync(tmp, filePath);
  } catch (err) {
    console.warn("Failed to save co-planner data:", err.message);
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

const plans = loadStore(PLANS_FILE);
const invites = loadStore(INVITES_FILE);

// Auto-save helper — call after any mutation
function savePlans() { saveStore(plans, PLANS_FILE); }
function saveInvites() { saveStore(invites, INVITES_FILE); }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateId() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

function now() {
  return new Date().toISOString();
}

function getProduct(id) {
  // Sync lookup from local mockData (for enrichPlan which is called frequently)
  const p = products.find((pr) => pr.id === id);
  if (!p) {
    // Check the async cache (populated after first getAllProducts call)
    const cached = productCache.get(id);
    if (cached) return cached;
    return null;
  }
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.images?.[0] || p.thumbnail,
    category: p.category,
    trustScore: p.trustScore,
    rating: p.rating,
    reviewCount: p.reviewCount,
  };
}

// Cache for non-local products (DummyJSON, Open Library)
const productCache = new Map();

// Async version that checks ALL products (including DummyJSON and Open Library)
async function getProductAsync(id) {
  // Try local first
  const local = getProduct(id);
  if (local) return local;

  // Try full catalogue and cache results
  try {
    const allProducts = await getAllProducts();
    // Cache all for future sync lookups
    for (const p of allProducts) {
      if (!productCache.has(p.id)) {
        productCache.set(p.id, {
          id: p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          image: p.images?.[0] || p.thumbnail,
          category: p.category,
          trustScore: p.trustScore || p.productScore,
          rating: p.rating,
          reviewCount: p.reviewCount,
        });
      }
    }
    return productCache.get(id) || null;
  } catch (_) {
    return null;
  }
}

// Pre-warm the cache at startup
getAllProducts().then((allP) => {
  for (const p of allP) {
    if (!products.find((lp) => lp.id === p.id)) {
      productCache.set(p.id, {
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.images?.[0] || p.thumbnail,
        category: p.category,
        trustScore: p.trustScore || p.productScore,
        rating: p.rating,
        reviewCount: p.reviewCount,
      });
    }
  }
  console.log(`Co-Planner: cached ${productCache.size} external products`);
}).catch(() => {});

function fuzzyMatch(a, b) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // Word overlap
  const wordsA = a.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const wordsB = b.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const overlap = wordsA.filter((w) => wordsB.some((wb) => wb.includes(w) || w.includes(wb)));
  return overlap.length >= Math.min(2, Math.max(1, Math.floor(wordsA.length * 0.5)));
}

function calculateHealthScore(plan) {
  let score = 100;
  const stats = getPlanStats(plan);

  // Budget adherence (-20 if over budget)
  if (stats.totalSpent > plan.budget) score -= 20;
  else if (stats.totalSpent + stats.totalPlanned > plan.budget) score -= 10;

  // Completion rate (reward progress)
  const purchased = plan.items.filter((i) => i.status === "purchased" || i.status === "delivered" || i.status === "partially_purchased").length;
  const total = plan.items.length;
  if (total > 0) {
    const completionPct = purchased / total;
    score -= Math.round((1 - completionPct) * 15);
  }

  // Unassigned items penalty
  const unassigned = plan.items.filter((i) => !i.assignedTo && i.status !== "purchased" && i.status !== "delivered").length;
  if (total > 0 && unassigned / total > 0.5) score -= 10;

  // Overdue items
  const overdue = plan.items.filter((i) => i.neededBy && new Date(i.neededBy) < new Date() && i.status !== "purchased" && i.status !== "delivered").length;
  score -= overdue * 5;

  return Math.max(0, Math.min(100, score));
}

function computeItemStatus(item) {
  // Auto-compute status from quantities (preserve "delivered" if manually set)
  if (item.status === "delivered") return "delivered";
  const qNeeded = item.quantityNeeded || 1;
  const qPurchased = item.quantityPurchased || 0;
  if (qPurchased <= 0) return "need_to_buy";
  if (qPurchased > 0 && qPurchased < qNeeded) return "partially_purchased";
  return "purchased"; // qPurchased >= qNeeded
}

function getPlanStats(plan) {
  const enrichedItems = plan.items.map((item) => ({ ...item, product: getProduct(item.productId) }));
  const totalSpent = enrichedItems
    .filter((i) => i.status === "purchased" || i.status === "delivered")
    .reduce((s, i) => s + (i.product?.price || 0) * (i.quantityPurchased || 1), 0);
  const totalPlanned = enrichedItems
    .filter((i) => i.status !== "purchased" && i.status !== "delivered")
    .reduce((s, i) => s + (i.product?.price || 0) * (i.quantityNeeded || 1), 0);
  const remaining = plan.budget - totalSpent - totalPlanned;

  const memberSpending = {};
  plan.members.forEach((m) => { memberSpending[m.name] = 0; });
  enrichedItems.forEach((i) => {
    if (i.assignedTo && memberSpending[i.assignedTo] !== undefined) {
      memberSpending[i.assignedTo] += (i.product?.price || 0) * (i.quantityPurchased || (i.status === "purchased" || i.status === "delivered" ? 1 : 0));
    }
  });

  // Quantity stats
  const totalNeeded = plan.items.reduce((s, i) => s + (i.quantityNeeded || 1), 0);
  const totalPurchased = plan.items.reduce((s, i) => s + (i.quantityPurchased || 0), 0);

  return {
    totalSpent,
    totalPlanned,
    remaining: Math.max(0, plan.budget - totalSpent),
    itemCount: plan.items.length,
    purchasedCount: plan.items.filter((i) => i.status === "purchased" || i.status === "delivered").length,
    assignedCount: plan.items.filter((i) => i.assignedTo).length,
    overBudget: totalSpent > plan.budget,
    perMemberBudget: plan.members.length > 0 ? Math.round(plan.budget / plan.members.length) : plan.budget,
    memberSpending,
    pendingCount: plan.items.filter((i) => i.status === "need_to_buy" || i.status === "partially_purchased").length,
    totalNeeded,
    totalPurchased,
  };
}

function enrichPlan(plan) {
  const enrichedItems = plan.items.map((item) => {
    const product = getProduct(item.productId);
    // Backward compatibility: default quantity fields
    const quantityNeeded = item.quantityNeeded || 1;
    const quantityPurchased = item.quantityPurchased || 0;
    const status = computeItemStatus(item);
    return {
      ...item,
      quantityNeeded,
      quantityPurchased,
      status,
      product: product || { id: item.productId, name: item.productId, price: 0, image: null, category: "Unknown", trustScore: 0, rating: 0, reviewCount: 0 },
    };
  });

  const stats = getPlanStats(plan);
  const health = calculateHealthScore(plan);

  return {
    ...plan,
    items: enrichedItems,
    stats,
    health,
  };
}

// Async version for API responses — resolves DummyJSON/OL products too
async function enrichPlanAsync(plan) {
  // Ensure cache is warm for all items
  for (const item of plan.items) {
    if (!getProduct(item.productId)) {
      await getProductAsync(item.productId);
    }
  }
  // Now enrich — if product still not found, provide a stub so items never vanish
  const enrichedItems = plan.items.map((item) => {
    const product = getProduct(item.productId);
    // Backward compatibility: default quantity fields
    const quantityNeeded = item.quantityNeeded || 1;
    const quantityPurchased = item.quantityPurchased || 0;
    const status = computeItemStatus(item);
    return {
      ...item,
      quantityNeeded,
      quantityPurchased,
      status,
      product: product || { id: item.productId, name: item.productId, price: 0, image: null, category: "Unknown", trustScore: 0, rating: 0, reviewCount: 0 },
    };
  });

  const stats = getPlanStats(plan);
  const health = calculateHealthScore(plan);

  return {
    ...plan,
    items: enrichedItems,
    stats,
    health,
  };
}

function addActivity(plan, action, by, meta = {}) {
  plan.activity.unshift({ id: generateId(), action, by, at: now(), ...meta });
  if (plan.activity.length > 100) plan.activity.length = 100;
  savePlans(); // persist after every mutation
}

// ─── CATEGORY SUGGESTIONS ────────────────────────────────────────────────────
const CATEGORY_RECOMMENDATIONS = {
  "Electronics > Televisions": ["p002", "p008", "p009"],
  "Electronics > Audio": ["p008", "p009"],
  "Home & Kitchen": ["p005"],
  "Grocery": ["p007"],
};

const FORGOTTEN_ITEMS = {
  tv: ["p009", "p008", "p002"],
  audio: ["p009"],
  kitchen: ["p005"],
  bedroom: ["p007"],
};

// ─── GET /api/co-planner/my-plans?member=NAME ────────────────────────────────
// Returns all plans where the given member name is a member
router.get("/my-plans", (req, res) => {
  const { member } = req.query;
  if (!member) return res.json({ plans: [] });

  const userPlans = [];
  const memberLower = member.toLowerCase();
  for (const [id, plan] of plans) {
    if (plan.status === "archived") continue;
    if (plan.members.some((m) => m.name.toLowerCase() === memberLower)) {
      userPlans.push({ id: plan.id, name: plan.name, budget: plan.budget });
    }
  }
  res.json({ plans: userPlans });
});

// ─── POST /api/co-planner/create ─────────────────────────────────────────────
router.post("/create", (req, res) => {
  const { name, description, budget, targetDate, category, createdBy } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: "Goal name is required" });

  const plan = {
    id: generateId(),
    name: name.trim(),
    description: description?.trim() || "",
    budget: budget || 50000,
    targetDate: targetDate || null,
    category: category || "general",
    status: "active", // active | completed | archived
    members: [{ name: createdBy || "You", role: "owner", color: "#FF9900", joinedAt: now() }],
    items: [],
    activity: [{ id: generateId(), action: "Plan created", by: createdBy || "You", at: now() }],
    expenses: [], // { id, productId, amount, splitType, splits: [{member, amount, paid}] }
    notifications: [],
    createdAt: now(),
  };

  plans.set(plan.id, plan);
  savePlans();
  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/checkout-purchased ─────────────────────────────────
// Called automatically after successful checkout. Marks matching items as
// purchased across ALL plans the member belongs to.
router.post("/checkout-purchased", async (req, res) => {
  const { productIds, memberName } = req.body;
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: "productIds array required" });
  }
  if (!memberName) {
    return res.status(400).json({ error: "memberName required" });
  }

  const memberLower = memberName.toLowerCase();
  const results = []; // track what was marked

  for (const [planId, plan] of plans) {
    if (plan.status === "archived") continue;
    // Only process plans this member belongs to
    if (!plan.members.some((m) => m.name.toLowerCase() === memberLower)) continue;

    for (const item of plan.items) {
      if (!productIds.includes(item.productId)) continue;
      // Skip already fully purchased items (prevent duplicates)
      if (item.status === "purchased" || item.status === "delivered") continue;

      const remaining = (item.quantityNeeded || 1) - (item.quantityPurchased || 0);
      if (remaining <= 0) continue;

      // Mark the full remaining quantity as purchased
      item.quantityPurchased = item.quantityNeeded || 1;
      item.status = computeItemStatus(item);
      item.purchasedBy = memberName;
      item.purchasedAt = now();

      const product = await getProductAsync(item.productId);
      addActivity(plan, `"${product?.name || item.productId}" auto-marked as purchased (checkout)`, memberName, { productId: item.productId });

      results.push({ planId, productId: item.productId, purchasedBy: memberName });

      // Emit real-time update to all plan members
      if (io) {
        const enriched = await enrichPlanAsync(plan);
        io.to(`coplan:${planId}`).emit("coplan:item-purchased", {
          planId,
          productId: item.productId,
          purchasedBy: memberName,
          purchasedAt: item.purchasedAt,
          quantityPurchased: item.quantityPurchased,
          status: item.status,
          plan: enriched,
        });
      }
    }
  }

  res.json({ success: true, marked: results });
});

// ─── POST /api/co-planner/:planId/checkout-mark ──────────────────────────────
// Marks specific items as purchased in a SINGLE plan (called after checkout)
router.post("/:planId/checkout-mark", async (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productIds, memberName } = req.body;
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: "productIds array required" });
  }
  if (!memberName) {
    return res.status(400).json({ error: "memberName required" });
  }

  const results = [];

  for (const item of plan.items) {
    if (!productIds.includes(item.productId)) continue;
    // Skip already fully purchased items
    if (item.status === "purchased" || item.status === "delivered") continue;

    const remaining = (item.quantityNeeded || 1) - (item.quantityPurchased || 0);
    if (remaining <= 0) continue;

    item.quantityPurchased = item.quantityNeeded || 1;
    item.status = computeItemStatus(item);
    item.purchasedBy = memberName;
    item.purchasedAt = now();

    const product = await getProductAsync(item.productId);
    addActivity(plan, `"${product?.name || item.productId}" auto-marked as purchased (checkout)`, memberName, { productId: item.productId });

    results.push({ productId: item.productId, purchasedBy: memberName });
  }

  if (results.length > 0 && io) {
    const enriched = await enrichPlanAsync(plan);
    io.to(`coplan:${plan.id}`).emit("coplan:item-purchased", {
      planId: plan.id,
      plan: enriched,
    });
  }

  res.json({ success: true, marked: results });
});

// ─── GET /api/co-planner/:planId ─────────────────────────────────────────────
router.get("/:planId", async (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  res.json({ plan: await enrichPlanAsync(plan) });
});

// ─── POST /api/co-planner/:planId/invite ─────────────────────────────────────
router.post("/:planId/invite", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { expiration, createdBy } = req.body; // "never" | "24h" | "7d"
  const token = generateToken();

  let expiresAt = null;
  if (expiration === "24h") expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  else if (expiration === "7d") expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const invite = {
    token,
    planId: plan.id,
    planName: plan.name,
    expiresAt,
    createdBy: createdBy || "You",
    createdAt: now(),
    usedCount: 0,
    revoked: false,
  };

  invites.set(token, invite);
  saveInvites();
  addActivity(plan, "Invite link created", createdBy || "You");

  res.json({ invite });
});

// ─── POST /api/co-planner/join/:token ────────────────────────────────────────
router.post("/join/:token", (req, res) => {
  const invite = invites.get(req.params.token);
  if (!invite) return res.status(404).json({ error: "Invalid invite link" });
  if (invite.revoked) return res.status(410).json({ error: "This invite has been revoked" });
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return res.status(410).json({ error: "This invite has expired" });
  }

  const plan = plans.get(invite.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { memberName } = req.body;
  const name = memberName?.trim() || "Guest";

  if (plan.members.some((m) => m.name === name)) {
    // Already a member — just return the plan so they can view it
    return res.json({ plan: enrichPlan(plan), alreadyMember: true });
  }

  const colors = ["#007185", "#CC0C39", "#1B5E20", "#6366f1", "#db2777", "#0891b2", "#7c3aed"];
  const color = colors[plan.members.length % colors.length];

  plan.members.push({ name, role: "member", color, joinedAt: now() });
  invite.usedCount++;
  saveInvites();
  addActivity(plan, `${name} joined via invite`, name);

  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/:planId/revoke-invite ──────────────────────────────
router.post("/:planId/revoke-invite", (req, res) => {
  const { token } = req.body;
  const invite = invites.get(token);
  if (!invite) return res.status(404).json({ error: "Invite not found" });
  invite.revoked = true;
  saveInvites();
  res.json({ success: true });
});

// ─── POST /api/co-planner/:planId/add-item ───────────────────────────────────
router.post("/:planId/add-item", async (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, memberName, priority, neededBy, quantity } = req.body;
  const addQuantity = quantity || 1;
  const product = await getProductAsync(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  // Duplicate check (exact) — only block if added by ANOTHER member
  if (plan.items.some((i) => i.productId === productId)) {
    const existing = plan.items.find((i) => i.productId === productId);
    // Same member can add again — increase quantityNeeded
    if (existing.addedBy === memberName || existing.assignedTo === memberName) {
      const oldQty = existing.quantityNeeded || 1;
      existing.quantityNeeded = oldQty + addQuantity;
      existing.status = computeItemStatus(existing);
      addActivity(plan, `Increased quantity for "${product.name}" (${oldQty} → ${existing.quantityNeeded})`, memberName || "Anonymous", { productId });
      return res.json({ plan: enrichPlan(plan), quantityIncreased: true });
    }
    // Different member — return 409 with details and canIncreaseQuantity flag
    const isPurchased = existing.status === "purchased" || existing.status === "delivered";
    const statusMsg = isPurchased
      ? "This item has already been purchased for this Co-Plan."
      : "This item is already in the Co-Plan cart.";
    return res.status(409).json({
      error: "duplicate",
      message: `${statusMsg} (Added by ${existing.addedBy})`,
      existingItem: { ...existing, product: getProduct(existing.productId) || product },
      isPurchased,
      canIncreaseQuantity: !isPurchased,
      currentQuantity: existing.quantityNeeded || 1,
      addedBy: existing.addedBy,
    });
  }

  // Fuzzy duplicate check — only warn if added by another member
  const fuzzyDup = plan.items.find((i) => {
    const p = getProduct(i.productId);
    return p && fuzzyMatch(p.name, product.name) && p.id !== productId;
  });
  if (fuzzyDup && fuzzyDup.addedBy !== memberName) {
    const dupProduct = getProduct(fuzzyDup.productId) || { name: fuzzyDup.productId };
    const isPurchased = fuzzyDup.status === "purchased" || fuzzyDup.status === "delivered";
    return res.status(409).json({
      error: "similar_exists",
      message: `Similar item "${dupProduct.name}" already exists${isPurchased ? " (purchased)" : ""}. Added by ${fuzzyDup.addedBy}.`,
      existingItem: { ...fuzzyDup, product: dupProduct },
      allowOverride: true,
      isPurchased,
    });
  }

  plan.items.push({
    productId,
    quantityNeeded: addQuantity,
    quantityPurchased: 0,
    status: "need_to_buy",
    assignedTo: null,
    addedBy: memberName || "Anonymous",
    addedAt: now(),
    priority: priority || "important",
    neededBy: neededBy || null,
    comments: [],
    votes: 0,
    downvotes: 0,
    split: null,
  });

  addActivity(plan, `Added "${product.name}" (qty: ${addQuantity})`, memberName || "Anonymous", { productId });
  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/:planId/add-item-force ─────────────────────────────
// Bypasses fuzzy duplicate check
router.post("/:planId/add-item-force", async (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, memberName, priority, neededBy, quantity } = req.body;
  const product = await getProductAsync(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  if (plan.items.some((i) => i.productId === productId)) {
    return res.status(409).json({ error: "duplicate", message: "Exact duplicate exists" });
  }

  plan.items.push({
    productId,
    quantityNeeded: quantity || 1,
    quantityPurchased: 0,
    status: "need_to_buy",
    assignedTo: null,
    addedBy: memberName || "Anonymous",
    addedAt: now(),
    priority: priority || "important",
    neededBy: neededBy || null,
    comments: [],
    votes: 0,
    downvotes: 0,
    split: null,
  });

  addActivity(plan, `Added "${product.name}" (override)`, memberName || "Anonymous", { productId });
  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/:planId/increase-quantity ──────────────────────────
router.post("/:planId/increase-quantity", async (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, additionalQuantity, memberName } = req.body;
  const item = plan.items.find((i) => i.productId === productId);
  if (!item) return res.status(404).json({ error: "Item not in plan" });

  const addQty = additionalQuantity || 1;
  const oldQty = item.quantityNeeded || 1;
  item.quantityNeeded = Math.max(1, oldQty + addQty);
  item.status = computeItemStatus(item);

  const product = await getProductAsync(productId);
  addActivity(plan, `${memberName || "Someone"} increased quantity for "${product?.name || productId}" (${oldQty} → ${item.quantityNeeded})`, memberName || "Anonymous", { productId });

  res.json({ plan: await enrichPlanAsync(plan) });
});

// ─── POST /api/co-planner/:planId/mark-purchased ─────────────────────────────
router.post("/:planId/mark-purchased", async (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, purchasedCount, memberName } = req.body;
  const item = plan.items.find((i) => i.productId === productId);
  if (!item) return res.status(404).json({ error: "Item not in plan" });

  const addCount = purchasedCount || 1;
  const oldPurchased = item.quantityPurchased || 0;
  item.quantityPurchased = Math.max(0, oldPurchased + addCount);
  item.status = computeItemStatus(item);

  // Store purchasedBy/purchasedAt when fully purchased
  if (item.status === "purchased" && !item.purchasedBy) {
    item.purchasedBy = memberName || "System";
    item.purchasedAt = now();
  }

  // Clear purchasedBy/purchasedAt when no longer fully purchased
  if (item.status !== "purchased" && item.status !== "delivered") {
    item.purchasedBy = null;
    item.purchasedAt = null;
  }

  const product = await getProductAsync(productId);
  const action = addCount > 0
    ? `Marked ${addCount} of "${product?.name || productId}" as purchased (${oldPurchased} → ${item.quantityPurchased})`
    : `Adjusted purchased count for "${product?.name || productId}" (${oldPurchased} → ${item.quantityPurchased})`;
  addActivity(plan, action, memberName || "System", { productId });

  const enriched = await enrichPlanAsync(plan);

  // Emit real-time update to all plan members
  if (io) {
    io.to(`coplan:${plan.id}`).emit("coplan:item-purchased", {
      planId: plan.id,
      productId,
      purchasedBy: item.purchasedBy,
      purchasedAt: item.purchasedAt,
      quantityPurchased: item.quantityPurchased,
      status: item.status,
      plan: enriched,
    });
  }

  res.json({ plan: enriched });
});

// ─── POST /api/co-planner/:planId/assign ─────────────────────────────────────
router.post("/:planId/assign", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, assignTo } = req.body;
  const item = plan.items.find((i) => i.productId === productId);
  if (!item) return res.status(404).json({ error: "Item not in plan" });

  const prevAssigned = item.assignedTo;
  item.assignedTo = assignTo || null;
  item.status = assignTo ? "assigned" : "need_to_buy";

  const product = getProduct(productId);
  addActivity(plan, assignTo ? `Assigned "${product?.name}" to ${assignTo}` : `Unassigned "${product?.name}"`, "System", { productId });

  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/:planId/update-status ──────────────────────────────
router.post("/:planId/update-status", async (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, status, memberName } = req.body;
  const item = plan.items.find((i) => i.productId === productId);
  if (!item) return res.status(404).json({ error: "Item not in plan" });

  // Only allow manual "delivered" status override; other statuses are auto-computed from quantities
  if (status === "delivered") {
    item.status = "delivered";
  } else if (status === "need_to_buy") {
    // Allow resetting — set quantityPurchased to 0
    item.quantityPurchased = 0;
    item.status = computeItemStatus(item);
  } else {
    // For other statuses, recompute from quantities
    item.status = computeItemStatus(item);
  }

  const product = await getProductAsync(productId);
  addActivity(plan, `Marked "${product?.name || productId}" as ${(item.status).replace(/_/g, " ")}`, memberName || "System", { productId });

  res.json({ plan: await enrichPlanAsync(plan) });
});

// ─── POST /api/co-planner/:planId/remove-item ────────────────────────────────
router.post("/:planId/remove-item", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, memberName } = req.body;
  const product = getProduct(productId);
  plan.items = plan.items.filter((i) => i.productId !== productId);
  addActivity(plan, `Removed "${product?.name}"`, memberName || "User", { productId });

  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/:planId/split-expense ──────────────────────────────
router.post("/:planId/split-expense", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, splitType, splits } = req.body;
  // splitType: "equal" | "percentage" | "amount" | "single_buyer"
  // splits: [{ member, amount, percentage, paid }]

  const item = plan.items.find((i) => i.productId === productId);
  if (!item) return res.status(404).json({ error: "Item not in plan" });

  const product = getProduct(productId);
  const price = product?.price || 0;

  let computedSplits;
  if (splitType === "equal") {
    const perPerson = Math.round(price / plan.members.length);
    computedSplits = plan.members.map((m) => ({ member: m.name, amount: perPerson, paid: false }));
  } else if (splitType === "percentage" && splits) {
    computedSplits = splits.map((s) => ({ member: s.member, amount: Math.round(price * (s.percentage || 0) / 100), paid: false }));
  } else if (splitType === "amount" && splits) {
    computedSplits = splits.map((s) => ({ member: s.member, amount: s.amount || 0, paid: false }));
  } else {
    computedSplits = [{ member: item.assignedTo || plan.members[0]?.name, amount: price, paid: false }];
  }

  item.split = { type: splitType, splits: computedSplits };

  const expenseEntry = { id: generateId(), productId, amount: price, splitType, splits: computedSplits, createdAt: now() };
  plan.expenses.push(expenseEntry);

  addActivity(plan, `Split expense for "${product?.name}" (${splitType})`, "System", { productId });
  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/:planId/leave ──────────────────────────────────────
router.post("/:planId/leave", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { memberName } = req.body;
  const memberIdx = plan.members.findIndex((m) => m.name === memberName);
  if (memberIdx === -1) return res.status(404).json({ error: "Member not found" });

  const member = plan.members[memberIdx];

  if (plan.members.length === 1) {
    // Last member — archive
    plan.status = "archived";
    plan.members = [];
    addActivity(plan, `${memberName} left. Plan archived.`, memberName);
  } else if (member.role === "owner") {
    // Transfer ownership
    plan.members.splice(memberIdx, 1);
    plan.members[0].role = "owner";
    addActivity(plan, `${memberName} left. Ownership transferred to ${plan.members[0].name}`, memberName);
  } else {
    plan.members.splice(memberIdx, 1);
    addActivity(plan, `${memberName} left the plan`, memberName);
  }

  // Unassign their items
  plan.items.forEach((item) => {
    if (item.assignedTo === memberName) {
      item.assignedTo = null;
      item.status = "need_to_buy";
    }
  });

  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/:planId/comment ────────────────────────────────────
router.post("/:planId/comment", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, memberName, text } = req.body;
  const item = plan.items.find((i) => i.productId === productId);
  if (!item) return res.status(404).json({ error: "Item not in plan" });

  item.comments.push({ id: generateId(), by: memberName || "Anonymous", text, at: now() });
  const product = getProduct(productId);
  addActivity(plan, `Commented on "${product?.name}"`, memberName || "Anonymous", { productId });

  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/:planId/vote ───────────────────────────────────────
router.post("/:planId/vote", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { productId, direction } = req.body;
  const item = plan.items.find((i) => i.productId === productId);
  if (!item) return res.status(404).json({ error: "Item not in plan" });

  if (direction === "down") {
    item.downvotes = (item.downvotes || 0) + 1;
  } else {
    item.votes = (item.votes || 0) + 1;
  }
  savePlans();
  res.json({ plan: enrichPlan(plan) });
});

// ─── POST /api/co-planner/:planId/reorder ────────────────────────────────────
// Reorders items and assigns priority based on position
router.post("/:planId/reorder", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { orderedProductIds } = req.body;
  if (!orderedProductIds || !Array.isArray(orderedProductIds)) {
    return res.status(400).json({ error: "orderedProductIds array required" });
  }

  // Reorder items based on provided order
  const itemMap = new Map(plan.items.map((i) => [i.productId, i]));
  const reordered = orderedProductIds
    .map((id) => itemMap.get(id))
    .filter(Boolean);

  // Assign priority based on position (top third = critical, middle = important, bottom = optional)
  const total = reordered.length;
  reordered.forEach((item, i) => {
    if (i < total / 3) item.priority = "critical";
    else if (i < (total * 2) / 3) item.priority = "important";
    else item.priority = "optional";
  });

  // Include any items not in the reorder list (shouldn't happen, but safety)
  const reorderedIds = new Set(orderedProductIds);
  const remaining = plan.items.filter((i) => !reorderedIds.has(i.productId));

  plan.items = [...reordered, ...remaining];
  savePlans();
  res.json({ plan: enrichPlan(plan) });
});

// ─── GET /api/co-planner/:planId/recommendations ─────────────────────────────
router.get("/:planId/recommendations", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const existingIds = new Set(plan.items.map((i) => i.productId));
  const existingCategories = plan.items
    .map((i) => getProduct(i.productId)?.category)
    .filter(Boolean);

  const remaining = plan.budget - getPlanStats(plan).totalSpent;

  // Find related products based on existing categories
  const recommended = products
    .filter((p) => !existingIds.has(p.id))
    .filter((p) => p.price <= remaining)
    .filter((p) => {
      return existingCategories.some((cat) => p.category === cat || p.category.split(" > ")[0] === cat.split(" > ")[0]);
    })
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 6)
    .map((p) => getProduct(p.id));

  // Frequently forgotten items (based on what's already in plan)
  const forgotten = products
    .filter((p) => !existingIds.has(p.id))
    .filter((p) => p.price <= remaining)
    .filter((p) => p.price < 5000) // accessories/small items
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)
    .map((p) => getProduct(p.id));

  res.json({ recommended, forgotten, remainingBudget: remaining });
});

// ─── GET /api/co-planner/:planId/timeline ────────────────────────────────────
router.get("/:planId/timeline", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const today = new Date();
  const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const groups = { thisWeek: [], thisMonth: [], later: [], noDueDate: [] };

  plan.items.forEach((item) => {
    const enriched = { ...item, product: getProduct(item.productId) };
    if (!item.neededBy) {
      groups.noDueDate.push(enriched);
    } else {
      const due = new Date(item.neededBy);
      if (due <= weekEnd) groups.thisWeek.push(enriched);
      else if (due <= monthEnd) groups.thisMonth.push(enriched);
      else groups.later.push(enriched);
    }
  });

  res.json(groups);
});

// ─── POST /api/co-planner/:planId/archive ────────────────────────────────────
router.post("/:planId/archive", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  plan.status = "archived";
  addActivity(plan, "Plan archived", req.body.memberName || "System");
  res.json({ plan: enrichPlan(plan) });
});

// ─── GET /api/co-planner/:planId/expenses-summary ────────────────────────────
router.get("/:planId/expenses-summary", (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const balances = {};
  plan.members.forEach((m) => { balances[m.name] = { owes: 0, owed: 0 }; });

  plan.expenses.forEach((exp) => {
    exp.splits.forEach((s) => {
      if (balances[s.member]) {
        if (!s.paid) balances[s.member].owes += s.amount;
        else balances[s.member].owed += s.amount;
      }
    });
  });

  res.json({ balances, totalExpenses: plan.expenses.length });
});

// ─── POST /api/co-planner/:planId/ai-suggestions ─────────────────────────────
// Uses AI to analyze plan name/description and suggest relevant products
router.post("/:planId/ai-suggestions", async (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const existingIds = new Set(plan.items.map((i) => i.productId));
  const budget = plan.budget;
  const stats = getPlanStats(plan);
  const remaining = budget - stats.totalSpent;

  // Build a compact product catalogue string for the AI
  const catalogue = products
    .filter((p) => !existingIds.has(p.id))
    .filter((p) => p.price <= remaining)
    .map((p) => `${p.id}|${p.name}|${p.category}|₹${p.price}|${p.rating}★`)
    .join("\n");

  if (!catalogue) {
    return res.json({ suggestions: [], reason: "No products fit remaining budget." });
  }

  // Try AI-powered suggestions first
  if (getGroq()) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 512,
        messages: [
          {
            role: "system",
            content: `You are a shopping assistant for an Indian e-commerce site.
Given a co-planning goal and a product catalogue, suggest the most relevant products.
Return ONLY a valid JSON array of objects with these fields:
- id: the product ID from the catalogue
- reason: one short sentence explaining why this product fits the goal

Pick 4-8 products maximum. Prioritize relevance to the goal name, then trust (rating), then value.
Only output valid JSON, nothing else.`,
          },
          {
            role: "user",
            content: `Goal: "${plan.name}"
Description: "${plan.description || "No description"}"
Budget remaining: ₹${remaining.toLocaleString("en-IN")}
Members: ${plan.members.length}

Available products:
${catalogue}`,
          },
        ],
      });

      const text = completion.choices[0].message.content.trim();
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

      const suggestions = parsed
        .map((s) => {
          const product = getProduct(s.id);
          if (!product) return null;
          return { ...product, aiReason: s.reason };
        })
        .filter(Boolean);

      return res.json({ suggestions, aiPowered: true });
    } catch (err) {
      console.warn("AI suggestions failed, falling back to keyword matching:", err.message);
    }
  }

  // Fallback: keyword-based matching from plan name
  const keywords = plan.name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Broader matching: also consider common goal-to-category mappings
  const GOAL_CATEGORY_MAP = {
    baby: ["Home & Kitchen", "Grocery"],
    office: ["Electronics > Monitors", "Electronics > Peripherals", "Electronics > Accessories", "Home & Kitchen > Furniture"],
    home: ["Home & Kitchen", "Electronics > Smart Home"],
    kitchen: ["Home & Kitchen > Kitchen", "Grocery"],
    gaming: ["Electronics > Peripherals", "Electronics > Monitors", "Electronics > Audio"],
    college: ["Electronics > Accessories", "Home & Kitchen > Furniture", "Stationery"],
    hostel: ["Home & Kitchen", "Electronics > Accessories", "Stationery"],
    apartment: ["Home & Kitchen", "Electronics > Smart Home", "Electronics > Televisions"],
    wedding: ["Electronics", "Home & Kitchen"],
    moving: ["Home & Kitchen", "Electronics > Smart Home"],
    startup: ["Electronics > Monitors", "Electronics > Peripherals", "Electronics > Accessories"],
    study: ["Electronics > Accessories", "Stationery", "Home & Kitchen > Furniture"],
    essentials: ["Home & Kitchen", "Grocery", "Electronics > Accessories"],
  };

  // Find matching categories from goal keywords
  const matchedCategories = new Set();
  keywords.forEach((kw) => {
    const cats = GOAL_CATEGORY_MAP[kw];
    if (cats) cats.forEach((c) => matchedCategories.add(c));
  });

  let scored;
  if (matchedCategories.size > 0) {
    // Category-based matching
    scored = products
      .filter((p) => !existingIds.has(p.id))
      .filter((p) => p.price <= remaining)
      .filter((p) => {
        const pCat = (p.category || "").toLowerCase();
        return [...matchedCategories].some((mc) => pCat.includes(mc.toLowerCase()));
      })
      .sort((a, b) => b.rating - a.rating || b.trustScore - a.trustScore)
      .slice(0, 8)
      .map((p) => ({ ...getProduct(p.id), aiReason: `Recommended for "${plan.name}"` }));
  } else {
    // Pure keyword matching
    scored = products
      .filter((p) => !existingIds.has(p.id))
      .filter((p) => p.price <= remaining)
      .map((p) => {
        const haystack = [p.name, p.category, p.brand, ...(p.features || [])].join(" ").toLowerCase();
        const score = keywords.reduce((acc, kw) => acc + (haystack.includes(kw) ? 1 : 0), 0);
        return { ...p, _score: score };
      })
      .filter((p) => p._score > 0)
      .sort((a, b) => b._score - a._score || b.rating - a.rating)
      .slice(0, 8)
      .map((p) => ({ ...getProduct(p.id), aiReason: `Matches your goal keywords` }));
  }

  // If still nothing, return top-rated products within budget as generic suggestions
  if (scored.length === 0) {
    scored = products
      .filter((p) => !existingIds.has(p.id))
      .filter((p) => p.price <= remaining)
      .sort((a, b) => b.rating - a.rating || b.trustScore - a.trustScore)
      .slice(0, 6)
      .map((p) => ({ ...getProduct(p.id), aiReason: `Top-rated product within your budget` }));
  }

  res.json({ suggestions: scored, aiPowered: false });
});
export default router;
