/**
 * shop.js
 * - productCardHTML(): shared card markup used on Home rails, Shop grid,
 *   category pages, and "related products" on the product page.
 * - initShopPage(): full listing page with search / category / price / sort
 *   and a skeleton-loading simulation (stands in for a future API latency).
 */
(function(){
  "use strict";

  function starString(rating){
    const full = Math.round(rating);
    return "★".repeat(full) + "☆".repeat(5-full);
  }

  function productCardHTML(p){
    const wished = window.CreaseEditsWishlist && window.CreaseEditsWishlist.has(p.id);
    const stockLabel = p.stock === 0 ? '<span class="stock out">Out of stock</span>'
      : p.stock <= 5 ? `<span class="stock low">Only ${p.stock} left</span>`
      : '<span class="stock in">In stock</span>';
    const tag = p.tags && p.tags[0]
      ? `<span class="tag ${p.tags[0]==='sale' ? 'gold':''}">${p.tags[0]==='new'?'New':p.tags[0]==='sale'?'Sale':'Bestseller'}</span>`
      : "";
    const priceHTML = p.oldPrice
      ? `<span class="price">$${p.price}</span><span class="price old">$${p.oldPrice}</span>`
      : `<span class="price">$${p.price}</span>`;

    return `
    <article class="product-card reveal-zoom" data-id="${p.id}" data-category="${p.category}" data-price="${p.price}">
      ${tag}
      <a href="product.html?id=${p.id}" class="thumb-link">
        <div class="thumb">
          <img src="${p.images[0]}" alt="${p.name}" loading="lazy" width="700" height="900">
        </div>
      </a>
      <div class="quick-actions">
        <button type="button" class="wish-btn ${wished?'is-active':''}" aria-label="Add to wishlist" title="Add to wishlist">
          <svg viewBox="0 0 24 24" fill="${wished?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.6-10-9.2C.6 8.1 2.4 4 6.4 4c2.1 0 3.7 1.2 4.6 2.8C11.9 5.2 13.5 4 15.6 4c4 0 5.8 4.1 4.4 7.8-2.5 4.6-10 9.2-10 9.2z"/></svg>
        </button>
        <button type="button" class="cart-btn" aria-label="Add to cart" title="Add to cart" ${p.stock===0?'disabled':''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>
        </button>
        <button type="button" class="share-btn" aria-label="Share product" title="Share" data-id="${p.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8 15.8 6.2M8.2 13.2l7.6 4.6"/></svg>
        </button>
      </div>
      <div class="info">
        <div class="cat">${p.category}</div>
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="stars" aria-label="Rated ${p.rating} of 5">${starString(p.rating)} <span class="muted" style="font-size:.72rem;">(${p.reviews})</span></div>
        <div class="price-row">${priceHTML}</div>
        <div style="margin-top:.4rem;">${stockLabel}</div>
      </div>
    </article>`;
  }

  function skeletonCard(){
    return `<div class="product-card skeleton" style="height:420px;"></div>`;
  }

  function wireCardEvents(container){
    container.querySelectorAll(".wish-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const card = btn.closest(".product-card");
        const active = window.CreaseEditsWishlist.toggle(card.dataset.id);
        btn.classList.toggle("is-active", active);
        btn.querySelector("svg").setAttribute("fill", active ? "currentColor" : "none");
      });
    });
    container.querySelectorAll(".cart-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const card = btn.closest(".product-card");
        window.CreaseEditsCart.add(card.dataset.id, null, null, 1);
        toast(`Added "${card.querySelector("h3").textContent}" to cart`);
      });
    });
    container.querySelectorAll(".share-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const url = `${location.origin}${location.pathname.replace(/[^/]*$/,'')}product.html?id=${btn.dataset.id}`;
        if (navigator.share){ try{ await navigator.share({ url }); }catch(_){} }
        else { await navigator.clipboard.writeText(url).catch(()=>{}); toast("Link copied to clipboard"); }
      });
    });
  }

  function toast(msg){
    let el = document.getElementById("ceToast");
    if (!el){
      el = document.createElement("div");
      el.id = "ceToast";
      el.style.cssText = "position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--ink);color:var(--cream);padding:.9rem 1.6rem;border-radius:999px;font-size:.85rem;z-index:5000;opacity:0;transition:all .4s cubic-bezier(.22,1,.36,1);box-shadow:0 14px 40px rgba(0,0,53,.35);";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateX(-50%) translateY(0)"; });
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.style.opacity = "0"; el.style.transform = "translateX(-50%) translateY(20px)";
    }, 2200);
  }
  window.ceToast = toast;

  function renderRail(containerId, list){
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = list.map(productCardHTML).join("");
    wireCardEvents(el);
    if (window.CEAnimations) window.CEAnimations.observeNew(el);
  }
  window.renderProductRail = renderRail;
  window.productCardHTML = productCardHTML;

  /* ---------------- Full shop / category listing ---------------- */
  function initShopPage(fixedCategory){
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    const searchInput = document.getElementById("searchInput");
    const sortSelect = document.getElementById("sortSelect");
    const priceRange = document.getElementById("priceRange");
    const priceOutput = document.getElementById("priceOutput");
    const categoryChecks = document.querySelectorAll(".cat-filter");
    const resultCount = document.getElementById("resultCount");
    const clearBtn = document.getElementById("clearFilters");

    let state = {
      q: "",
      categories: fixedCategory ? [fixedCategory] : [],
      maxPrice: 300,
      sort: "featured"
    };

    function apply(){
      let list = PRODUCTS.filter(p => {
        if (state.categories.length && !state.categories.includes(p.category)) return false;
        if (p.price > state.maxPrice) return false;
        if (state.q && !p.name.toLowerCase().includes(state.q.toLowerCase())) return false;
        return true;
      });
      switch(state.sort){
        case "price-asc": list.sort((a,b)=>a.price-b.price); break;
        case "price-desc": list.sort((a,b)=>b.price-a.price); break;
        case "rating": list.sort((a,b)=>b.rating-a.rating); break;
        case "newest": list = list.filter(p=>true).sort((a,b)=> (b.tags.includes('new')?1:0) - (a.tags.includes('new')?1:0)); break;
        default: break;
      }
      render(list);
    }

    function render(list){
      if (resultCount) resultCount.textContent = `${list.length} product${list.length!==1?'s':''}`;
      if (!list.length){
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
          <div class="icon">🔍</div><h3>No products match your filters</h3>
          <p class="muted">Try widening your price range or clearing filters.</p>
        </div>`;
        return;
      }
      grid.innerHTML = list.map(productCardHTML).join("");
      wireCardEvents(grid);
      if (window.CEAnimations) window.CEAnimations.observeNew(grid);
    }

    // simulate a brief skeleton loading state, like a real API call would have
    grid.innerHTML = Array(8).fill(skeletonCard()).join("");
    setTimeout(apply, 450);

    if (searchInput) searchInput.addEventListener("input", (e) => { state.q = e.target.value; apply(); });
    if (sortSelect) sortSelect.addEventListener("change", (e) => { state.sort = e.target.value; apply(); });
    if (priceRange) priceRange.addEventListener("input", (e) => {
      state.maxPrice = Number(e.target.value);
      if (priceOutput) priceOutput.textContent = `$${state.maxPrice}`;
      apply();
    });
    if (!fixedCategory && categoryChecks.length){
      categoryChecks.forEach(cb => cb.addEventListener("change", () => {
        state.categories = Array.from(categoryChecks).filter(c=>c.checked).map(c=>c.value);
        apply();
      }));
    }
    if (clearBtn){
      clearBtn.addEventListener("click", () => {
        state = { q:"", categories: fixedCategory ? [fixedCategory] : [], maxPrice:300, sort:"featured" };
        if (searchInput) searchInput.value = "";
        if (sortSelect) sortSelect.value = "featured";
        if (priceRange) priceRange.value = 300;
        if (priceOutput) priceOutput.textContent = "$300";
        categoryChecks.forEach(cb => cb.checked = false);
        apply();
      });
    }
  }
  window.initShopPage = initShopPage;

})();
