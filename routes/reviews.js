/**
 * routes/reviews.js
 * Reviews are stored flat in data/reviews.json with a productId on each.
 * Adding a review also recalculates that product's rating/reviews count.
 */
const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/db");
const { requireAuth } = require("../middleware/auth");
const { requireFields, isNonEmptyString } = require("../middleware/validate");

// GET /api/reviews/:productId
router.get("/:productId", (req, res) => {
  const reviews = readJSON("reviews").filter((r) => r.productId === req.params.productId);
  res.json({ reviews });
});

// POST /api/reviews/:productId
router.post("/:productId", requireAuth, requireFields(["rating", "text"]), (req, res) => {
  const { rating, text } = req.body;
  const numRating = Number(rating);
  if (numRating < 1 || numRating > 5) return res.status(400).json({ error: "Rating must be between 1 and 5." });
  if (!isNonEmptyString(text, 3)) return res.status(400).json({ error: "Review text is too short." });

  const products = readJSON("products");
  const product = products.find((p) => p.id === req.params.productId);
  if (!product) return res.status(404).json({ error: "Product not found." });

  const users = readJSON("users");
  const user = users.find((u) => u.id === req.session.userId);

  const review = {
    id: "r_" + Date.now().toString(36),
    productId: req.params.productId,
    userId: req.session.userId,
    name: user ? user.name : "Customer",
    rating: numRating,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  const reviews = readJSON("reviews");
  reviews.push(review);

  // recalculate the product's aggregate rating
  const productReviews = reviews.filter((r) => r.productId === product.id);
  const avgRating = productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length;
  const updatedProducts = products.map((p) =>
    p.id === product.id ? { ...p, rating: Math.round(avgRating * 10) / 10, reviews: productReviews.length } : p
  );

  Promise.all([writeJSON("reviews", reviews), writeJSON("products", updatedProducts)])
    .then(() => res.status(201).json({ review }))
    .catch(() => res.status(500).json({ error: "Could not save review." }));
});

module.exports = router;
