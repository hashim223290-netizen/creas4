/**
 * animations.js
 * All JS-driven motion in one module: page loader, cursor glow, button
 * ripple, IntersectionObserver scroll-reveal, and the slide page-transition
 * overlay. main.js calls CEAnimations.init() once the header/footer exist.
 */
window.CEAnimations = (function(){
  "use strict";

  function initPageLoader(){
    const loader = document.querySelector(".page-loader");
    if (!loader) return;
    window.addEventListener("load", () => setTimeout(() => loader.classList.add("is-hidden"), 350));
    setTimeout(() => loader.classList.add("is-hidden"), 1800); // fallback
  }

  function initCursorGlow(){
    if (!window.matchMedia("(pointer:fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);
    let raf = null;
    document.addEventListener("mousemove", (e) => {
      glow.style.opacity = "1";
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
      });
    });
    document.addEventListener("mouseleave", () => { glow.style.opacity = "0"; });
  }

  function initRipple(){
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size/2) + "px";
      ripple.style.top = (e.clientY - rect.top - size/2) + "px";
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  function initReveal(){
    const items = document.querySelectorAll(".reveal, .reveal-zoom, .reveal-left, .reveal-right");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)){
      items.forEach(el => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(el => io.observe(el));
  }

  // Re-runs reveal-observation for nodes injected after initial load (e.g. shop grid results)
  function observeNew(container){
    const items = container.querySelectorAll(".reveal, .reveal-zoom, .reveal-left, .reveal-right");
    items.forEach((el,i) => {
      el.style.setProperty("--i", i % 8);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-visible")));
    });
  }

  function initPageTransitionLinks(){
    const overlay = document.createElement("div");
    overlay.className = "page-transition";
    document.body.appendChild(overlay);
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || a.target === "_blank") return;
      if (!href.endsWith(".html")) return;
      e.preventDefault();
      overlay.classList.add("is-active");
      setTimeout(() => { window.location.href = href; }, 380);
    });
  }

  function init(){
    initPageLoader();
    initCursorGlow();
    initRipple();
    initReveal();
    initPageTransitionLinks();
  }

  return { init, observeNew };
})();
