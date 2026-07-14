/**
 * middleware/auth.js
 * Session-based guards. req.session.userId / req.session.role are set at
 * login time by routes/auth.js and routes/admin.js.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "You must be signed in to do that." });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId || req.session.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
