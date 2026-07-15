/**
 * products-data.js
 * Static product catalog for the frontend-only phase.
 * Shape mirrors what /data/products.json + the Express API will return later,
 * so shop.js / product.js won't need to change when the backend is wired in —
 * only the fetch source will move from PRODUCTS (this array) to /api/products.
 *
 * Intentionally empty — the real catalog now lives in data/products.json and
 * is managed entirely from the admin dashboard (add / delete). This array is
 * only ever used as a last-resort fallback if a page is opened without the
 * server running at all, so there's nothing "dummy" left to show.
 */
const PRODUCTS_FALLBACK = [];

// PRODUCTS starts as the offline fallback (empty, so pages render instantly
// without the server) and is swapped for live API data by components.js
// via setProducts() once /api/products responds.
let PRODUCTS = PRODUCTS_FALLBACK;
let NEW_ARRIVALS = [];
let BEST_SELLERS = [];
let SALE_ITEMS = [];

function recomputeProductLists() {
  const tagged = PRODUCTS.filter((p) => p.tags && p.tags.includes("new"));
  // Fall back to the most recently added products if nothing is explicitly
  // tagged "new" yet, so the New Arrivals rail is never empty on a catalog
  // that predates the "new" tag.
  NEW_ARRIVALS = tagged.length
    ? tagged
    : [...PRODUCTS].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  BEST_SELLERS = PRODUCTS.filter((p) => p.tags && p.tags.includes("bestseller"));
  SALE_ITEMS = PRODUCTS.filter((p) => p.tags && p.tags.includes("sale"));
}
function setProducts(list) {
  // Accept the live list even when it's empty (a freshly-cleared catalog is
  // valid) — only reject non-arrays, so a failed/malformed API response
  // can't wipe out a page that already rendered.
  if (Array.isArray(list)) PRODUCTS = list;
  recomputeProductLists();
}
recomputeProductLists();
