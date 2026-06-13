import { Router } from "express";
import { companies, getCompanyById, getCompanyByName, addCompany, refreshCompanyMetrics } from "../data/companies.js";

const router = Router();

// GET /api/companies — full list
router.get("/", (req, res) => {
  const { verified } = req.query;
  let result = companies;
  if (verified === "true")  result = companies.filter((c) => c.verified);
  if (verified === "false") result = companies.filter((c) => !c.verified);
  res.json({ total: result.length, companies: result });
});

// GET /api/companies/stats — summary across all companies
router.get("/stats", (req, res) => {
  const verified   = companies.filter((c) => c.verified);
  const unverified = companies.filter((c) => !c.verified);
  const avgReturn  = companies.reduce((s, c) => s + (c.trustMetrics?.returnRate  || 0), 0) / companies.length;
  const avgReorder = companies.reduce((s, c) => s + (c.trustMetrics?.reorderRate || 0), 0) / companies.length;
  res.json({
    total:            companies.length,
    verified:         verified.length,
    unverified:       unverified.length,
    avgReturnRate:    parseFloat(avgReturn.toFixed(3)),
    avgReorderRate:   parseFloat(avgReorder.toFixed(3)),
  });
});

// GET /api/companies/:id — by id
router.get("/:id", (req, res) => {
  const co = getCompanyById(req.params.id);
  if (!co) return res.status(404).json({ message: "Company not found" });
  res.json(co);
});

// GET /api/companies/name/:name — by seller name (URL-encoded)
router.get("/name/:name", (req, res) => {
  const co = getCompanyByName(decodeURIComponent(req.params.name));
  if (!co) return res.status(404).json({ message: "Company not found" });
  res.json(co);
});

// POST /api/companies — register new company
router.post("/", (req, res) => {
  const { name, category, foundedYear, sellerRating, fulfillment, description, hq } = req.body;
  if (!name) return res.status(400).json({ message: "name is required" });
  const existing = getCompanyByName(name);
  if (existing) return res.status(409).json({ message: "Company already registered", company: existing });
  const co = addCompany({ name, category, foundedYear, sellerRating, fulfillment, description, hq });
  res.status(201).json(co);
});

// PUT /api/companies/:id — update company profile
router.put("/:id", (req, res) => {
  const co = getCompanyById(req.params.id);
  if (!co) return res.status(404).json({ message: "Company not found" });
  const allowed = ["category","foundedYear","sellerRating","fulfillment","description","hq","verified"];
  allowed.forEach((k) => { if (req.body[k] !== undefined) co[k] = req.body[k]; });
  res.json(co);
});

// POST /api/companies/:id/refresh-metrics — recompute trust metrics from customer data
router.post("/:id/refresh-metrics", (req, res) => {
  const co = getCompanyById(req.params.id);
  if (!co) return res.status(404).json({ message: "Company not found" });
  const updated = refreshCompanyMetrics(co.name);
  res.json(updated);
});

export default router;
