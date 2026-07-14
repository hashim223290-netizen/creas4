/**
 * components.js
 * Vanilla-JS "includes" — builds the navbar and footer once and injects them
 * into every page via #site-header / #site-footer. Keeps 20+ pages in sync
 * without a templating engine. Works over file:// (no fetch/CORS needed).
 */

function buildHeader(activePage){
  const links = [
    ["index.html","Home"],
    ["shop.html","Shop"],
    ["men.html","Men"],
    ["women.html","Women"],
    ["shoes.html","Shoes"],
    ["accessories.html","Accessories"],
    ["about.html","About"],
    ["contact.html","Contact"],
  ];

  const navLinks = links.map(([href,label]) =>
    `<a href="${href}" ${activePage===href ? 'aria-current="page"':''}>${label}</a>`
  ).join("");

  const mobileLinks = links.map(([href,label]) =>
    `<a href="${href}" ${activePage===href ? 'aria-current="page"':''}>${label}</a>`
  ).join("");

  return `
  <nav class="navbar" id="navbar" aria-label="Primary">
    <div class="container">
      <a href="index.html" class="brand">Crease<span>Edits</span></a>

      <div class="nav-links" id="navLinks">${navLinks}</div>

      <div class="nav-actions">
        <a href="wishlist.html" class="icon-btn" aria-label="Wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.6-10-9.2C.6 8.1 2.4 4 6.4 4c2.1 0 3.7 1.2 4.6 2.8C11.9 5.2 13.5 4 15.6 4c4 0 5.8 4.1 4.4 7.8-2.5 4.6-10 9.2-10 9.2z"/></svg>
          <span class="badge" id="wishlistBadge" hidden>0</span>
        </a>
        <a href="cart.html" class="icon-btn" aria-label="Shopping cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>
          <span class="badge" id="cartBadge" hidden>0</span>
        </a>
        <a href="login.html" class="icon-btn" aria-label="Account" id="accountLink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </a>
        <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobilePanel">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>

  <div class="mobile-panel" id="mobilePanel">
    ${mobileLinks}
    <div class="flex gap-3" style="margin-top:2rem;">
      <a href="login.html" class="btn btn-outline btn-sm">Sign In</a>
      <a href="cart.html" class="btn btn-primary btn-sm">Cart</a>
    </div>
  </div>`;
}

function buildFooter(){
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">Clean<span style="color:var(--gold);font-style:italic;font-weight:400;">Edits</span></div>
          <p style="color:rgba(250,247,241,.65);max-width:320px;">Considered clothing, shoes and accessories for men and women — cut for quality, styled for every day.</p>
          <div class="social-row">
            <a href="#" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
            </a>
            <a href="#" aria-label="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 3h-2a5 5 0 0 0-5 5v2H6v4h2v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="Pinterest">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M9.5 17c1-4 1.2-6 1.2-7.5a2 2 0 1 1 4 .2c0 1.4-1 3.8-1.5 5.3-.4 1.3.6 2.3 1.8 1.8 2-.8 3-3 3-5.3A5.5 5.5 0 0 0 12.3 6 5.7 5.7 0 0 0 6.5 12c0 1.6.5 2.6 1.3 3.4"/></svg>
            </a>
          </div>
        </div>
        <div>
          <h4>Shop</h4>
          <ul>
            <li><a href="men.html">Men</a></li>
            <li><a href="women.html">Women</a></li>
            <li><a href="shoes.html">Shoes</a></li>
            <li><a href="accessories.html">Accessories</a></li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="privacy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms of Service</a></li>
          </ul>
        </div>
        <div class="footer-col-newsletter">
          <h4>Stay in the loop</h4>
          <p style="color:rgba(250,247,241,.65);">New arrivals and private sales, once or twice a month.</p>
          <form class="newsletter-form" id="newsletterForm">
            <label for="newsletterEmail" class="sr-only">Email address</label>
            <input type="email" id="newsletterEmail" placeholder="Your email" required>
            <button type="submit" class="btn btn-primary btn-sm">Join</button>
          </form>
          <p class="hint" id="newsletterMsg" style="color:var(--gold);margin-top:.6rem;" hidden>Thanks — you're on the list.</p>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 Crease Edits. All rights reserved.</span>
        <span>Street 1, 5th Road, Bangsar Plaza Commercial Market, Rawalpindi 46300, Pakistan · 0322 9274852</span>
      </div>
    </div>
  </footer>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  // Try to refresh the catalog from the live API; silently keep the
  // static fallback (already loaded by products-data.js) if the server
  // isn't running or this page was opened directly as a file.
  if (window.CEApi) {
    try {
      const { products } = await window.CEApi.getProducts();
      if (typeof setProducts === "function") setProducts(products);
    } catch (err) {
      // offline / server not running — PRODUCTS_FALLBACK is already active
    }
  }

  const headerEl = document.getElementById("site-header");
  const footerEl = document.getElementById("site-footer");
  const page = document.body.getAttribute("data-page") || "";

  if (headerEl) headerEl.innerHTML = buildHeader(page);
  if (footerEl) footerEl.innerHTML = buildFooter();

  document.dispatchEvent(new CustomEvent("components:ready"));
});
