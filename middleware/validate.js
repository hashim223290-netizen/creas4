/**
 * middleware/validate.js
 * Small, dependency-free validation helpers shared by the route files.
 */
function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isNonEmptyString(value, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength;
}

function isPositiveNumber(value) {
  return typeof value === "number" && !Number.isNaN(value) && value >= 0;
}

// Express middleware factory: validate(['name','email']) checks presence only.
function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => {
      const v = req.body ? req.body[f] : undefined;
      return v === undefined || v === null || v === "";
    });
    if (missing.length) {
      return res.status(400).json({ error: `Missing required field(s): ${missing.join(", ")}` });
    }
    next();
  };
}

module.exports = { isEmail, isNonEmptyString, isPositiveNumber, requireFields };
