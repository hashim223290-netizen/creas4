/**
 * checkout.js — powers checkout.html
 * Renders the live order summary from CreaseEditsCart, validates the form,
 * and on submit "places" the order (stored to localStorage ce_orders) then
 * redirects to order-success.html and clears the cart. Real payment
 * processing and server-side order storage are added with the backend.
 */
(function(){
  "use strict";
  document.addEventListener("components:ready", init);

  function init(){
    const summary = document.getElementById("checkoutSummary");
    if (!summary) return;
    renderSummary();
    wirePaymentTabs();
    wireForm();
  }

  function renderSummary(){
    const lines = window.CreaseEditsCart.lines();
    const wrap = document.getElementById("checkoutSummary");
    if (!lines.length){
      wrap.innerHTML = `<p class="muted">Your cart is empty.</p>`;
      document.getElementById("placeOrderBtn").disabled = true;
      return;
    }
    wrap.innerHTML = lines.map(l => `
      <div class="flex justify-between items-center" style="padding:.7rem 0;border-bottom:1px solid rgba(0,0,53,.08);">
        <div class="flex items-center gap-3">
          <img src="${l.product.images[0]}" alt="${l.product.name}" style="width:52px;height:64px;object-fit:cover;border-radius:8px;">
          <div>
            <div style="font-weight:600;font-size:.9rem;">${l.product.name}</div>
            <div class="muted" style="font-size:.78rem;">${l.item.size||''} ${l.item.color? '· '+l.item.color:''} · Qty ${l.item.qty}</div>
          </div>
        </div>
        <div style="font-weight:600;">$${l.lineTotal.toFixed(2)}</div>
      </div>`).join("");

    const subtotal = window.CreaseEditsCart.subtotal();
    const shipping = subtotal > 100 ? 0 : 9.95;
    const tax = subtotal * 0.05;
    const total = subtotal + shipping + tax;
    document.getElementById("sumSubtotal").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("sumShipping").textContent = shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`;
    document.getElementById("sumTax").textContent = `$${tax.toFixed(2)}`;
    document.getElementById("sumTotal").textContent = `$${total.toFixed(2)}`;
  }

  function wirePaymentTabs(){
    const tabs = document.querySelectorAll(".pay-tab");
    tabs.forEach(tab => tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.querySelectorAll(".pay-panel").forEach(p => p.hidden = true);
      document.getElementById(tab.dataset.target).hidden = false;
    }));
  }

  function wireForm(){
    const form = document.getElementById("checkoutForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const required = form.querySelectorAll("[required]");
      let ok = true;
      required.forEach(field => {
        const field_wrap = field.closest(".form-field");
        if (!field.value.trim()){
          field_wrap.classList.add("has-error");
          ok = false;
        } else field_wrap.classList.remove("has-error");
      });
      if (!ok){ window.ceToast && window.ceToast("Please fill in the highlighted fields"); return; }

      const lines = window.CreaseEditsCart.lines();
      if (!lines.length){ window.ceToast && window.ceToast("Your cart is empty"); return; }

      const activeTab = document.querySelector(".pay-tab.is-active");
      const paymentMethod = activeTab ? activeTab.textContent.trim() : "Card";

      const payload = {
        items: lines.map(l => ({ id: l.product.id, qty: l.item.qty, size: l.item.size, color: l.item.color })),
        customer: {
          name: document.getElementById("ckName").value,
          email: document.getElementById("ckEmail").value,
          phone: document.getElementById("ckPhone").value,
        },
        shipping: {
          address: document.getElementById("ckAddress").value,
          city: document.getElementById("ckCity").value,
          zip: document.getElementById("ckZip").value,
        },
        paymentMethod,
      };

      const btn = document.getElementById("placeOrderBtn");
      btn.disabled = true;
      btn.textContent = "Placing order…";

      try {
        const { order } = await window.CEApi.placeOrder(payload);
        localStorage.setItem("ce_last_order", JSON.stringify(order));
        window.CreaseEditsCart.clear();
        location.href = "order-success.html";
      } catch (err) {
        window.ceToast && window.ceToast(err.message || "Could not place order");
        btn.disabled = false;
        btn.textContent = "Place Order";
      }
    });
  }
})();
