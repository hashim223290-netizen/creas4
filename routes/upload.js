/**
 * routes/upload.js
 * Admin-only image upload for product photos.
 *
 * No multer/third-party upload library needed: the browser reads the chosen
 * file as a base64 data URL (FileReader) and POSTs it as JSON. This route
 * decodes it, validates the type/size, and writes it to /uploads, which is
 * already served statically by server.js since it lives at the project root.
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// POST /api/upload  (admin)  Body: { data: "data:image/png;base64,...." }
router.post("/", requireAdmin, (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== "string") {
    return res.status(400).json({ error: "No image data provided." });
  }

  const match = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return res.status(400).json({ error: "Invalid image data." });

  const ext = ALLOWED_TYPES[match[1]];
  if (!ext) return res.status(400).json({ error: "Only JPG, PNG, WEBP, or GIF images are allowed." });

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: "Image is too large (max 5MB)." });
  }

  const filename = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  fs.writeFile(path.join(UPLOAD_DIR, filename), buffer, (err) => {
    if (err) return res.status(500).json({ error: "Could not save image." });
    res.status(201).json({ url: `/uploads/${filename}` });
  });
});

module.exports = router;
