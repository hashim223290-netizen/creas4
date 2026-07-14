/**
 * utils/db.js
 * The "database" for this project is a set of JSON files in /data, as
 * specified in the brief. This module centralises reading/writing them so
 * every route uses the same (safe) pattern instead of calling fs directly.
 *
 * Writes are queued per-file so two fast requests editing the same file
 * (e.g. two orders placed at once) can't clobber each other.
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const queues = {};

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readJSON(name) {
  const file = filePath(name);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[db] Failed to parse ${name}.json:`, err.message);
    return [];
  }
}

// Queues writes to the same file so concurrent requests don't interleave.
function writeJSON(name, data) {
  const file = filePath(name);
  const run = () =>
    new Promise((resolve, reject) => {
      fs.writeFile(file, JSON.stringify(data, null, 2), "utf8", (err) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

  const prior = queues[name] || Promise.resolve();
  const next = prior.then(run, run);
  queues[name] = next.catch(() => {}); // keep the chain alive even after an error
  return next;
}

module.exports = { readJSON, writeJSON, DATA_DIR };
