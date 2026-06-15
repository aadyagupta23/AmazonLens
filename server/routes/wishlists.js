import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, "../data/wishlists.json");

function readFile() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeFile(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/wishlists/:userId — load wishlist
router.get("/:userId", (req, res) => {
  const db = readFile();
  res.json({ items: db[req.params.userId] || [] });
});

// POST /api/wishlists/:userId — save full wishlist
router.post("/:userId", (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: "items array required" });
  const db = readFile();
  db[req.params.userId] = items;
  writeFile(db);
  res.json({ ok: true, count: items.length });
});

export default router;
