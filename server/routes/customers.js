import { Router } from "express";
import {
  customers, getCustomerById, getCustomersForProduct,
  getCustomersForSeller, getProductStats, addCustomer, recordActivity,
  getProductReviews, addReview, recordReturn,
} from "../data/customers.js";
import { invalidateProductCache } from "./products.js";

const router = Router();

// GET /api/customers — paginated list
router.get("/", (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const start = (page - 1) * limit;
  res.json({
    total: customers.length,
    page,
    pages: Math.ceil(customers.length / limit),
    customers: customers.slice(start, start + limit).map(({ orders, ...c }) => ({
      ...c, orderCount: orders.length,
    })),
  });
});

// GET /api/customers/stats — aggregate stats across all customers
router.get("/stats", (req, res) => {
  const totalOrders    = customers.reduce((s, c) => s + c.totalOrders, 0);
  const totalReturns   = customers.reduce((s, c) => s + c.orders.filter((o) => o.returned).length, 0);
  const totalReorders  = customers.reduce((s, c) => s + c.orders.filter((o) => o.reordered).length, 0);
  const totalReviews   = customers.reduce((s, c) => s + c.orders.filter((o) => o.reviewed).length, 0);
  res.json({
    totalCustomers: customers.length,
    totalOrders,
    avgOrdersPerCustomer: parseFloat((totalOrders / customers.length).toFixed(1)),
    overallReturnRate:  parseFloat((totalReturns  / totalOrders).toFixed(3)),
    overallReorderRate: parseFloat((totalReorders / totalOrders).toFixed(3)),
    reviewCoverage:     parseFloat((totalReviews  / totalOrders).toFixed(3)),
  });
});

// GET /api/customers/product/:productId — customers who ordered a specific product
router.get("/product/:productId", (req, res) => {
  const { productId } = req.params;
  const result = getCustomersForProduct(productId);
  const stats  = getProductStats(productId);
  res.json({
    productId,
    stats,
    customers: result.map((c) => {
      const order = c.orders.find((o) => o.productId === productId);
      return { id: c.id, name: c.name, city: c.city, memberSince: c.memberSince, order };
    }),
  });
});

// GET /api/customers/seller/:sellerName — customers who bought from a seller
router.get("/seller/:sellerName", (req, res) => {
  const sellerName = decodeURIComponent(req.params.sellerName);
  const result     = getCustomersForSeller(sellerName);
  const sellerOrders = result.flatMap((c) => c.orders.filter((o) => o.seller === sellerName));
  const returned    = sellerOrders.filter((o) => o.returned);
  const reordered   = sellerOrders.filter((o) => o.reordered);
  const reviewed    = sellerOrders.filter((o) => o.reviewed && o.rating != null);
  res.json({
    sellerName,
    totalBuyers:    result.length,
    totalOrders:    sellerOrders.length,
    returnRate:     parseFloat((returned.length  / sellerOrders.length).toFixed(3)),
    reorderRate:    parseFloat((reordered.length / sellerOrders.length).toFixed(3)),
    avgRating:      reviewed.length ? parseFloat((reviewed.reduce((s, o) => s + o.rating, 0) / reviewed.length).toFixed(2)) : null,
    customers: result.slice(0, 20).map((c) => ({ id: c.id, name: c.name, city: c.city })),
  });
});

// GET /api/customers/reviews/:productId — paginated reviews from customer DB
router.get("/reviews/:productId", (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(200, parseInt(req.query.limit) || 10);
  res.json(getProductReviews(req.params.productId, page, limit));
});

// POST /api/customers/reviews — submit a new review (creates customer if needed)
router.post("/reviews", (req, res) => {
  const { name, email, password, productId, seller, rating, title, body } = req.body;
  if (!name || !email || !productId || !rating || !title || !body)
    return res.status(400).json({ message: "name, email, productId, rating, title, and body are required" });
  if (rating < 1 || rating > 5)
    return res.status(400).json({ message: "rating must be between 1 and 5" });

  const result = addReview({ name, email, password, productId, seller, rating: Number(rating), title, body });
  if (result.error === "already_reviewed")
    return res.status(409).json({ message: "You have already reviewed this product" });
  invalidateProductCache(); // force product list to recompute scores + review counts
  res.status(201).json(result.review);
});

// POST /api/customers/return — record a return for a customer by email
router.post("/return", (req, res) => {
  const { email, productId, reason = "" } = req.body;
  if (!email || !productId) return res.status(400).json({ message: "email and productId are required" });
  const updated = recordReturn(email, productId, reason);
  if (!updated) return res.status(404).json({ message: "Customer not found" });
  invalidateProductCache();
  res.json({ ok: true });
});

// GET /api/customers/:id — single customer with full order history
router.get("/:id", (req, res) => {
  const c = getCustomerById(req.params.id);
  if (!c) return res.status(404).json({ message: "Customer not found" });
  res.json(c);
});

// POST /api/customers — add new customer
router.post("/", (req, res) => {
  const { name, email, phone, city, state, memberSince } = req.body;
  if (!name || !email) return res.status(400).json({ message: "name and email are required" });
  const c = addCustomer({ name, email, phone, city, state, memberSince: memberSince || String(new Date().getFullYear()) });
  res.status(201).json(c);
});

// POST /api/customers/:id/activity — record order / return / review / reorder
router.post("/:id/activity", (req, res) => {
  const { type, productId, seller, amount, reason, rating } = req.body;
  if (!type) return res.status(400).json({ message: "activity type is required" });
  const updated = recordActivity(req.params.id, { type, productId, seller, amount, reason, rating });
  if (!updated) return res.status(404).json({ message: "Customer not found" });
  invalidateProductCache(); // scores may shift with new return/reorder data
  res.json(updated);
});

export default router;
