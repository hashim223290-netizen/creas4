/**
 * routes/auth.js
 * Customer account endpoints. Passwords are hashed with Node's core
 * crypto.scrypt (see utils/hash.js) — never stored or returned in plain text.
 */
const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/db");
const { hashPassword, verifyPassword } = require("../utils/hash");
const { isEmail, isNonEmptyString, requireFields } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// POST /api/auth/register
router.post("/register", requireFields(["name", "email", "password"]), (req, res) => {
  const { name, email, password } = req.body;

  if (!isNonEmptyString(name, 2)) return res.status(400).json({ error: "Enter your full name." });
  if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const users = readJSON("users");
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const user = {
    id: "u_" + Date.now().toString(36),
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    role: "customer",
    createdAt: new Date().toISOString(),
  };
  users.push(user);

  writeJSON("users", users)
    .then(() => {
      req.session.userId = user.id;
      req.session.role = user.role;
      res.status(201).json({ user: publicUser(user) });
    })
    .catch(() => res.status(500).json({ error: "Could not create account. Try again." }));
});

// POST /api/auth/login
router.post("/login", requireFields(["email", "password"]), (req, res) => {
  const { email, password } = req.body;
  const users = readJSON("users");
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ user: publicUser(user) });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const users = readJSON("users");
  const user = users.find((u) => u.id === req.session.userId);
  if (!user) return res.status(404).json({ error: "Account not found." });
  res.json({ user: publicUser(user) });
});

module.exports = router;
