/**
 * main.js
 * Site-wide behaviour that isn't purely animation: navbar scroll state +
 * mobile menu, header badge sync, newsletter stub. Delegates all motion
 * effects to animations.js (CEAnimations.init()). Runs after components.js
 * injects the header/footer (listens for the "components:ready" event).
 */
(function(){
  "use strict";

  document.addEventListener("components:ready", init);
  if (!document.getElementById("site-header")) document.addEventListener("DOMContentLoaded", init);

  function init(){
    initNavbar();
    initNewsletter();
    updateBadges();
    if (window.CEAnimations) window.CEAnimations.init();
  }

  /* ---------------- Navbar ---------------- */
  function initNavbar(){
    const nav = document.getElementById("navbar");
    const toggle = document.getElementById("navToggle");
    const panel = document.getElementById("mobilePanel");
    if (!nav) return;

    const onScroll = () => {
      if (window.scrollY > 40) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive:true });

    if (toggle && panel){
      toggle.addEventListener("click", () => {
        const open = panel.classList.toggle("is-open");
        toggle.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      });
      panel.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
        panel.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }));
    }
  }

  /* ---------------- Newsletter (wired to /shop-api/contact/newsletter) ---------------- */
  function initNewsletter(){
    const form = document.getElementById("newsletterForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type=email]") || form.querySelector("input");
      const msg = document.getElementById("newsletterMsg");
      const email = input ? input.value.trim() : "";
      if (!email) return;
      try {
        if (window.CEApi) await window.CEApi.subscribeNewsletter(email);
      } catch (err) {
        // silently succeed — avoids leaking subscription status
      }
      if (input) input.value = "";
      if (msg) msg.hidden = false;
    });
  }

  /* ---------------- Cart / Wishlist badges (shared header) ---------------- */
  function updateBadges(){
    const cartCount = window.CreaseEditsCart ? window.CreaseEditsCart.count() : 0;
    const wishCount = window.CreaseEditsWishlist ? window.CreaseEditsWishlist.count() : 0;
    setBadge("cartBadge", cartCount);
    setBadge("wishlistBadge", wishCount);
  }
  function setBadge(id, count){
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = count;
    el.hidden = count === 0;
  }
  document.addEventListener("cart:updated", updateBadges);
  document.addEventListener("wishlist:updated", updateBadges);
  window.updateHeaderBadges = updateBadges;

})();
