/**
 * product.js — powers product.html
 * Reads ?id= from the URL, renders gallery/variants/price/stock, wires
 * add-to-cart & wishlist, and fills the related-products rail.
 */
(function(){
  "use strict";

  document.addEventListener("components:ready", init);

  // Small mock review set keyed by product id, reused across a few items
  // so the reviews tab has believable content everywhere.
  const SAMPLE_REVIEWS = [
    { name:"Amara K.", rating:5, text:"Fit true to size and the fabric feels genuinely premium. Wearing it weekly." },
    { name:"Daniyal R.", rating:4, text:"Great quality for the price. Shipping to Rawalpindi took four days." },
    { name:"Zoya H.", rating:5, text:"Exactly like the photos, maybe better. Ordering the other colour next." },
    { name:"Bilal S.", rating:4, text:"Solid construction. Runs slightly large so consider sizing down." },
  ];

  function init(){
    const grid = document.getElementById("productMain");
    if (!grid) return;

    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const product = PRODUCTS.find(p => p.id === id) || PRODUCTS[0];

    renderProduct(product);
    renderGallery(product);
    renderReviews(product);
    renderRelated(product);
    wireTabs();
    wireActions(product);
    document.title = `${product.name} — Crease Edits`;
  }

  function renderProduct(p){
    document.getElementById("crumbCategory").textContent = p.category[0].toUpperCase() + p.category.slice(1);
    document.getElementById("crumbCategory").href = p.category + ".html";
    document.getElementById("productName").textContent = p.name;
    document.getElementById("productDesc").textContent = p.desc;
    document.getElementById("productPrice").innerHTML = p.oldPrice
      ? `<span class="price">$${p.price}</span> <span class="price old">$${p.oldPrice}</span>`
      : `<span class="price">$${p.price}</span>`;
    document.getElementById("productStars").textContent = "★".repeat(Math.round(p.rating)) + "☆".repeat(5-Math.round(p.rating));
    document.getElementById("productReviewCount").textContent = `${p.reviews} reviews`;

    const stockEl = document.getElementById("productStock");
    stockEl.textContent = p.stock === 0 ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left in stock` : "In stock, ready to ship";
    stockEl.className = "stock " + (p.stock === 0 ? "out" : p.stock <= 5 ? "low" : "in");

    // sizes
    const sizeWrap = document.getElementById("sizeOptions");
    sizeWrap.innerHTML = p.sizes.map((s,i) => `<button type="button" class="variant-btn ${i===0?'is-selected':''}" data-size="${s}">${s}</button>`).join("");
    // colors
    const colorWrap = document.getElementById("colorOptions");
    colorWrap.innerHTML = p.colors.map((c,i) => `<button type="button" class="variant-btn ${i===0?'is-selected':''}" data-color="${c}">${c}</button>`).join("");

    [sizeWrap, colorWrap].forEach(wrap => {
      wrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".variant-btn");
        if (!btn) return;
        wrap.querySelectorAll(".variant-btn").forEach(b => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
      });
    });

    document.getElementById("addToCartBtn").disabled = p.stock === 0;
  }

  function renderGallery(p){
    const mainImg = document.getElementById("galleryMain");
    const thumbs = document.getElementById("galleryThumbs");
    mainImg.src = p.images[0];
    mainImg.alt = p.name;
    thumbs.innerHTML = p.images.map((img,i) => `
      <button type="button" class="thumb-btn ${i===0?'is-selected':''}" data-src="${img}" aria-label="View image ${i+1}">
        <img src="${img}" alt="${p.name} view ${i+1}" loading="lazy">
      </button>`).join("");
    thumbs.addEventListener("click", (e) => {
      const btn = e.target.closest(".thumb-btn");
      if (!btn) return;
      mainImg.style.opacity = 0;
      setTimeout(() => { mainImg.src = btn.dataset.src; mainImg.style.opacity = 1; }, 180);
      thumbs.querySelectorAll(".thumb-btn").forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
    });
  }

  function renderReviews(p){
    const wrap = document.getElementById("reviewsList");
    if (!wrap) return;
    wrap.innerHTML = SAMPLE_REVIEWS.map(r => `
      <div class="review-item">
        <div class="flex justify-between items-center">
          <strong>${r.name}</strong>
          <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</span>
        </div>
        <p>${r.text}</p>
      </div>`).join("");
    document.getElementById("ratingBig").textContent = p.rating.toFixed(1);
    document.getElementById("ratingBigStars").textContent = "★".repeat(Math.round(p.rating)) + "☆".repeat(5-Math.round(p.rating));
    document.getElementById("ratingBigCount").textContent = `Based on ${p.reviews} reviews`;
  }

  function renderRelated(p){
    const related = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0,4);
    window.renderProductRail("relatedGrid", related.length ? related : PRODUCTS.filter(x=>x.id!==p.id).slice(0,4));
  }

  function wireTabs(){
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.querySelectorAll(".tab-panel").forEach(p => p.hidden = true);
      document.getElementById(tab.dataset.target).hidden = false;
    }));
  }

  function wireActions(p){
    const addBtn = document.getElementById("addToCartBtn");
    const wishBtn = document.getElementById("wishToggleBtn");
    const qtyInput = document.getElementById("qtyInput");
    document.getElementById("qtyMinus").addEventListener("click", () => {
      qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    });
    document.getElementById("qtyPlus").addEventListener("click", () => {
      qtyInput.value = Number(qtyInput.value) + 1;
    });

    addBtn.addEventListener("click", () => {
      const size = document.querySelector("#sizeOptions .is-selected")?.dataset.size;
      const color = document.querySelector("#colorOptions .is-selected")?.dataset.color;
      window.CreaseEditsCart.add(p.id, size, color, Number(qtyInput.value));
      window.ceToast(`Added "${p.name}" to cart`);
    });

    function refreshWish(){
      const active = window.CreaseEditsWishlist.has(p.id);
      wishBtn.classList.toggle("is-active", active);
      wishBtn.textContent = active ? "♥ Saved to Wishlist" : "♡ Add to Wishlist";
    }
    refreshWish();
    wishBtn.addEventListener("click", () => { window.CreaseEditsWishlist.toggle(p.id); refreshWish(); });

    document.getElementById("shareBtn").addEventListener("click", async () => {
      const url = location.href;
      if (navigator.share){ try{ await navigator.share({ url, title:p.name }); }catch(_){} }
      else { await navigator.clipboard.writeText(url).catch(()=>{}); window.ceToast("Link copied to clipboard"); }
    });
  }
})();
