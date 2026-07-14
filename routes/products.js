/**
 * routes/products.js
 * Public: GET /api/products (search/filter/sort), GET /api/products/:id
 * Admin only: POST, PUT /:id, DELETE /:id — gated by requireAdmin.
 */
const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/db");
const { requireAdmin } = require("../middleware/auth");
const { isNonEmptyString, isPositiveNumber, requireFields } = require("../middleware/validate");

// GET /api/products?category=men&search=blazer&minPrice=0&maxPrice=300&sort=price-asc
router.get("/", (req, res) => {
  let products = readJSON("products");
  const { category, search, minPrice, maxPrice, sort, tag } = req.query;

  if (category) products = products.filter((p) => p.category === category);
  if (tag) products = products.filter((p) => (p.tags || []).includes(tag));
  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (minPrice) products = products.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) products = products.filter((p) => p.price <= Number(maxPrice));

  switch (sort) {
    case "price-asc": products = [...products].sort((a, b) => a.price - b.price); break;
    case "price-desc": products = [...products].sort((a, b) => b.price - a.price); break;
    case "rating": products = [...products].sort((a, b) => b.rating - a.rating); break;
    case "newest": products = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    default: break;
  }

  res.json({ count: products.length, products });
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const products = readJSON("products");
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json({ product });
});

// POST /api/products  (admin)
router.post(
  "/",
  requireAdmin,
  requireFields(["name", "category", "price"]),
  (req, res) => {
    const { name, category, price, stock, images, colors, sizes, desc, oldPrice } = req.body;

    if (!isNonEmptyString(name)) return res.status(400).json({ error: "Product name is required." });
    if (!isPositiveNumber(Number(price))) return res.status(400).json({ error: "Price must be a positive number." });

    const products = readJSON("products");
    const product = {
      id: "p_" + Date.now().toString(36),
      name: name.trim(),
      category,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      stock: Number(stock) || 0,
      rating: 0,
      reviews: 0,
      tags: [],
      colors: Array.isArray(colors) && colors.length ? colors : ["Default"],
      sizes: Array.isArray(sizes) && sizes.length ? sizes : ["One Size"],
      images: Array.isArray(images) && images.length ? images : [`https://picsum.photos/seed/${Date.now()}/700/900`],
      desc: desc || "",
      createdAt: new Date().toISOString(),
    };
    products.push(product);
    writeJSON("products", products)
      .then(() => res.status(201).json({ product }))
      .catch(() => res.status(500).json({ error: "Could not save product." }));
  }
);

// PUT /api/products/:id  (admin)
router.put("/:id", requireAdmin, (req, res) => {
  const products = readJSON("products");
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found." });

  const allowed = ["name", "category", "price", "oldPrice", "stock", "images", "colors", "sizes", "desc", "tags", "rating"];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
  writeJSON("products", products)
    .then(() => res.json({ product: products[index] }))
    .catch(() => res.status(500).json({ error: "Could not update product." }));
});

// DELETE /api/products/:id  (admin)
router.delete("/:id", requireAdmin, (req, res) => {
  const products = readJSON("products");
  const next = products.filter((p) => p.id !== req.params.id);
  if (next.length === products.length) return res.status(404).json({ error: "Product not found." });

  writeJSON("products", next)
    .then(() => res.json({ ok: true }))
    .catch(() => res.status(500).json({ error: "Could not delete product." }));
});

module.exports = router;
