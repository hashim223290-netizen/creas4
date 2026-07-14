/**
 * routes/orders.js
 * POST /api/orders is open to guests (id from session if signed in, else
 * null) so checkout works whether or not the shopper has an account.
 * Listing endpoints require auth; a customer only ever sees their own.
 */
const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { requireFields, isPositiveNumber } = require("../middleware/validate");

// POST /api/orders — place an order from cart line items
router.post("/", requireFields(["items", "customer", "shipping"]), (req, res) => {
  const { items, customer, shipping, paymentMethod } = req.body;

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Your cart is empty." });
  }

  const products = readJSON("products");
  let subtotal = 0;
  const lineItems = [];

  for (const line of items) {
    const product = products.find((p) => p.id === line.id);
    if (!product) return res.status(400).json({ error: `Unknown product: ${line.id}` });
    const qty = Number(line.qty) || 1;
    if (product.stock < qty) {
      return res.status(409).json({ error: `"${product.name}" only has ${product.stock} left in stock.` });
    }
    subtotal += product.price * qty;
    lineItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty,
      size: line.size || null,
      color: line.color || null,
    });
  }

  const settings = readJSON("settings");
  const config = Array.isArray(settings) ? {} : settings; // settings.json is a single object, not an array
  const shippingCost = subtotal > (config.shippingThreshold ?? 100) ? 0 : (config.flatShippingRate ?? 9.95);
  const tax = subtotal * (config.taxRate ?? 0.05);
  const total = subtotal + shippingCost + tax;

  const order = {
    id: Math.floor(100000 + Math.random() * 900000),
    userId: req.session && req.session.userId ? req.session.userId : null,
    customer,
    shipping,
    paymentMethod: paymentMethod || "card",
    items: lineItems,
    subtotal,
    shippingCost,
    tax,
    total,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // decrement stock
  const updatedProducts = products.map((p) => {
    const line = lineItems.find((l) => l.productId === p.id);
    return line ? { ...p, stock: p.stock - line.qty } : p;
  });

  const orders = readJSON("orders");
  orders.unshift(order);

  Promise.all([writeJSON("orders", orders), writeJSON("products", updatedProducts)])
    .then(() => res.status(201).json({ order }))
    .catch(() => res.status(500).json({ error: "Could not place order. Try again." }));
});

// GET /api/orders — signed-in user's own orders, or all orders for admin
router.get("/", requireAuth, (req, res) => {
  const orders = readJSON("orders");
  if (req.session.role === "admin") return res.json({ orders });
  res.json({ orders: orders.filter((o) => o.userId === req.session.userId) });
});

// GET /api/orders/:id
router.get("/:id", requireAuth, (req, res) => {
  const orders = readJSON("orders");
  const order = orders.find((o) => String(o.id) === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (req.session.role !== "admin" && order.userId !== req.session.userId) {
    return res.status(403).json({ error: "You don't have access to this order." });
  }
  res.json({ order });
});

// PUT /api/orders/:id/status — admin updates fulfilment status
router.put("/:id/status", requireAdmin, requireFields(["status"]), (req, res) => {
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
  }
  const orders = readJSON("orders");
  const index = orders.findIndex((o) => String(o.id) === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Order not found." });

  orders[index].status = req.body.status;
  writeJSON("orders", orders)
    .then(() => res.json({ order: orders[index] }))
    .catch(() => res.status(500).json({ error: "Could not update order." }));
});

module.exports = router;
