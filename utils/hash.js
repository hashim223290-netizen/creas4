/**
 * utils/hash.js
 * Salted password hashing using Node's built-in crypto.scrypt — deliberately
 * dependency-free so auth works the moment `npm install` finishes, with
 * nothing that can fail to compile on a given platform (unlike native
 * bcrypt bindings). Format stored: "<saltHex>:<hashHex>".
 */
const crypto = require("crypto");

const KEY_LENGTH = 64;

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plainPassword, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(plainPassword, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const attemptHash = crypto.scryptSync(plainPassword, salt, KEY_LENGTH).toString("hex");
  const a = Buffer.from(originalHash, "hex");
  const b = Buffer.from(attemptHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { hashPassword, verifyPassword };
