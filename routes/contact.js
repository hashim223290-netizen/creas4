/**
 * routes/contact.js
 * Stores contact-form messages and newsletter sign-ups so the admin panel
 * (or a future email integration) has something to read from.
 */
const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/db");
const { requireFields, isEmail, isNonEmptyString } = require("../middleware/validate");

// POST /api/contact
router.post("/", requireFields(["name", "email", "message"]), (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!isNonEmptyString(name)) return res.status(400).json({ error: "Enter your name." });
  if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (!isNonEmptyString(message, 3)) return res.status(400).json({ error: "Enter a message." });

  const messages = readJSON("contact-messages");
  messages.unshift({
    id: "m_" + Date.now().toString(36),
    name,
    email,
    subject: subject || "General enquiry",
    message,
    createdAt: new Date().toISOString(),
  });

  writeJSON("contact-messages", messages)
    .then(() => res.status(201).json({ ok: true }))
    .catch(() => res.status(500).json({ error: "Could not send your message. Try again." }));
});

// POST /api/newsletter
router.post("/newsletter", requireFields(["email"]), (req, res) => {
  const { email } = req.body;
  if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });

  const list = readJSON("newsletter");
  if (list.find((s) => s.email.toLowerCase() === email.toLowerCase())) {
    return res.json({ ok: true, alreadySubscribed: true });
  }
  list.push({ email: email.toLowerCase(), subscribedAt: new Date().toISOString() });

  writeJSON("newsletter", list)
    .then(() => res.status(201).json({ ok: true }))
    .catch(() => res.status(500).json({ error: "Could not subscribe. Try again." }));
});

module.exports = router;
