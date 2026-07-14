/**
 * routes/admin.js
 * Separate login endpoint from customer auth so the admin session flag is
 * only ever set by verifying against a user whose role is literally
 * "admin" — a customer account can never elevate itself here.
 */
const express = require("express");
const router = express.Router();
const { readJSON } = require("../utils/db");
const { verifyPassword } = require("../utils/hash");
const { requireFields } = require("../middleware/validate");
const { requireAdmin } = require("../middleware/auth");

// POST /api/admin/login
router.post("/login", requireFields(["email", "password"]), (req, res) => {
  const { email, password } = req.body;
  const users = readJSON("users");
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase() && u.role === "admin");

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Incorrect admin email or password." });
  }

  req.session.userId = user.id;
  req.session.role = "admin";
  res.json({ admin: { id: user.id, name: user.name, email: user.email } });
});

// POST /api/admin/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// GET /api/admin/session — lets the dashboard check it's still logged in
router.get("/session", (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.role === "admin") });
});

// GET /api/admin/stats
router.get("/stats", requireAdmin, (req, res) => {
  const products = readJSON("products");
  const orders = readJSON("orders");
  const users = readJSON("users");

  res.json({
    totalProducts: products.length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    totalOrders: orders.length,
    revenue: Math.round(orders.reduce((s, o) => s + o.total, 0) * 100) / 100,
    totalCustomers: users.filter((u) => u.role === "customer").length,
    recentOrders: orders.slice(0, 5),
  });
});

module.exports = router;
