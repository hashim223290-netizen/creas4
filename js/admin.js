/**
 * admin.js
 * Talks to /api/admin/* and /api/products (see routes/admin.js,
 * routes/products.js). The dashboard checks /api/admin/session on load and
 * bounces to admin-login.html if the session isn't an admin session —
 * this is a real server-side check, not a client-side flag.
 */
(function(){
  "use strict";

  document.addEventListener("components:ready", () => {
    wireAdminLogin();
    guardDashboard();
  });

  function wireAdminLogin(){
    const form = document.getElementById("adminLoginForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.querySelector("#adminUser").value.trim();
      const password = form.querySelector("#adminPass").value;
      const errEl = document.getElementById("adminLoginError");
      errEl.hidden = true;
      try {
        await window.CEApi.adminLogin({ email, password });
        location.href = "admin-dashboard.html";
      } catch (err) {
        errEl.textContent = err.message || "Sign-in failed.";
        errEl.hidden = false;
      }
    });
  }

  async function guardDashboard(){
    const dash = document.getElementById("adminDashboard");
    if (!dash) return;
    try {
      const { isAdmin } = await window.CEApi.adminSession();
      if (!isAdmin){ location.href = "admin-login.html"; return; }
    } catch (err) {
      location.href = "admin-login.html";
      return;
    }
    wireDashboard();
  }

  function wireDashboard(){
    document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
      await window.CEApi.adminLogout();
      location.href = "admin-login.html";
    });

    renderStats();
    renderProductTable();
    renderOrdersTable();
    wireAddProductForm();
    wireNav();
  }

  function wireNav(){
    const tabs = document.querySelectorAll(".admin-tab");
    tabs.forEach(tab => tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.querySelectorAll(".admin-panel").forEach(p => p.hidden = true);
      document.getElementById(tab.dataset.target).hidden = false;
    }));
  }

  async function renderStats(){
    try {
      const stats = await window.CEApi.adminStats();
      document.getElementById("statProducts").textContent = stats.totalProducts;
      document.getElementById("statOrders").textContent = stats.totalOrders;
      document.getElementById("statRevenue").textContent = `$${stats.revenue.toFixed(2)}`;
      document.getElementById("statLowStock").textContent = stats.lowStock;
    } catch (err) {
      window.ceToast && window.ceToast("Could not load dashboard stats");
    }
  }

  async function renderProductTable(){
    const tbody = document.getElementById("productTableBody");
    if (!tbody) return;
    let products = [];
    try {
      ({ products } = await window.CEApi.getProducts());
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted" style="padding:1.5rem;">Could not load products.</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map((p) => `
      <tr>
        <td><img src="${p.images[0]}" alt="${p.name}" style="width:44px;height:56px;object-fit:cover;border-radius:6px;"></td>
        <td>${p.name}</td>
        <td style="text-transform:capitalize;">${p.category}</td>
        <td>$${p.price}</td>
        <td>${p.stock}</td>
        <td>${p.rating}</td>
        <td><button class="btn btn-sm btn-ghost" data-del="${p.id}">Delete</button></td>
      </tr>`).join("");

    tbody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this product?")) return;
        try {
          await window.CEApi.deleteProduct(btn.dataset.del);
          window.ceToast && window.ceToast("Product deleted");
          renderProductTable();
          renderStats();
        } catch (err) {
          window.ceToast && window.ceToast(err.message || "Could not delete product");
        }
      });
    });
  }

  // Reads a File as a base64 data URL (e.g. "data:image/png;base64,....").
  function readFileAsDataURL(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read the selected file."));
      reader.readAsDataURL(file);
    });
  }

  function wireAddProductForm(){
    const form = document.getElementById("addProductForm");
    if (!form) return;

    const imageInput = form.querySelector("#newProductImage");
    const preview = document.getElementById("newProductImagePreview");
    imageInput?.addEventListener("change", () => {
      const file = imageInput.files && imageInput.files[0];
      if (!file){ preview.hidden = true; return; }
      readFileAsDataURL(file).then((dataUrl) => {
        preview.src = dataUrl;
        preview.hidden = false;
      }).catch(() => { preview.hidden = true; });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.querySelector("#newProductName").value.trim();
      const category = form.querySelector("#newProductCategory").value;
      const price = Number(form.querySelector("#newProductPrice").value);
      const stock = Number(form.querySelector("#newProductStock").value);
      const file = imageInput?.files && imageInput.files[0];
      if (!name || !price) { window.ceToast && window.ceToast("Name and price are required"); return; }

      const submitBtn = document.getElementById("addProductSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.textContent = file ? "Uploading…" : "Adding…";

      try {
        let imageUrl = `https://picsum.photos/seed/${encodeURIComponent(name)}/700/900`;
        if (file) {
          const dataUrl = await readFileAsDataURL(file);
          const { url } = await window.CEApi.uploadImage(dataUrl);
          imageUrl = url;
        }

        await window.CEApi.createProduct({
          name, category, price, stock,
          images: [imageUrl],
          desc: "Newly added product — description pending.",
        });
        form.reset();
        preview.hidden = true;
        renderProductTable();
        renderStats();
        window.ceToast && window.ceToast("Product added");
      } catch (err) {
        window.ceToast && window.ceToast(err.message || "Could not add product");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Add Product";
      }
    });
  }

  const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

  /* ---- Order Detail Modal ---- */
  function openOrderModal(order){
    const modal = document.getElementById("orderModal");
    const content = document.getElementById("orderModalContent");
    if (!modal || !content) return;

    const c = order.customer || {};
    const s = order.shipping || {};
    const itemRows = (order.items || []).map(i =>
      `<tr>
        <td style="padding:.5rem .4rem;">${i.name}</td>
        <td style="padding:.5rem .4rem; text-align:center;">${i.size || "—"}</td>
        <td style="padding:.5rem .4rem; text-align:center;">${i.qty}</td>
        <td style="padding:.5rem .4rem; text-align:right;">Rs. ${(i.price * i.qty).toLocaleString()}</td>
      </tr>`).join("");

    content.innerHTML = `
      <h2 style="margin-bottom:var(--sp-3); font-size:1.3rem;">Order #${order.id}</h2>

      <h4 style="margin-bottom:.5rem; font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; color:#888;">Customer Information</h4>
      <div style="background:rgba(0,0,53,.03); border-radius:10px; padding:1rem 1.2rem; margin-bottom:var(--sp-3);">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:.5rem .8rem; font-size:.88rem;">
          <div><span style="color:#888;">Name</span><br><strong>${c.name || "—"}</strong></div>
          <div><span style="color:#888;">Email</span><br><strong>${c.email || "—"}</strong></div>
          <div><span style="color:#888;">Phone</span><br><strong>${c.phone || "—"}</strong></div>
          <div><span style="color:#888;">Payment</span><br><strong>${order.paymentMethod || "Cash on Delivery"}</strong></div>
        </div>
      </div>

      <h4 style="margin-bottom:.5rem; font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; color:#888;">Delivery Address</h4>
      <div style="background:rgba(0,0,53,.03); border-radius:10px; padding:1rem 1.2rem; margin-bottom:var(--sp-3); font-size:.88rem;">
        <strong>${s.address || "—"}</strong><br>
        ${s.city || ""}${s.city && s.zip ? ", " : ""}${s.zip || ""}
      </div>

      <h4 style="margin-bottom:.5rem; font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; color:#888;">Items Ordered</h4>
      <table style="font-size:.85rem; margin-bottom:var(--sp-3);">
        <thead><tr>
          <th style="padding:.5rem .4rem;">Product</th>
          <th style="padding:.5rem .4rem; text-align:center;">Size</th>
          <th style="padding:.5rem .4rem; text-align:center;">Qty</th>
          <th style="padding:.5rem .4rem; text-align:right;">Price</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="display:flex; justify-content:space-between; font-size:.88rem; padding:.3rem 0; border-top:1px solid rgba(0,0,53,.08); margin-top:.4rem;">
        <span class="muted">Subtotal</span><span>Rs. ${(order.subtotal||0).toLocaleString()}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:.88rem; padding:.3rem 0;">
        <span class="muted">Shipping</span><span>${(order.shippingCost||0) === 0 ? "Free" : "Rs. "+(order.shippingCost||0).toLocaleString()}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-weight:700; font-size:1rem; padding:.6rem 0; border-top:2px solid rgba(0,0,53,.12); margin-top:.3rem;">
        <span>Total</span><span>Rs. ${(order.total||0).toLocaleString()}</span>
      </div>
      <div style="margin-top:var(--sp-3); font-size:.82rem; color:#888;">
        Placed on ${new Date(order.createdAt).toLocaleString()} &nbsp;·&nbsp;
        Status: <strong style="text-transform:capitalize;">${order.status}</strong>
      </div>`;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeOrderModal(){
    const modal = document.getElementById("orderModal");
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "";
  }

  async function renderOrdersTable(){
    const tbody = document.getElementById("orderTableBody");
    if (!tbody) return;

    // Wire modal close buttons (once)
    const closeBtn = document.getElementById("orderModalClose");
    if (closeBtn && !closeBtn._wired) {
      closeBtn.addEventListener("click", closeOrderModal);
      closeBtn._wired = true;
      document.getElementById("orderModal").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeOrderModal();
      });
    }

    let orders = [];
    try {
      ({ orders } = await window.CEApi.myOrders()); // admin session -> returns ALL orders
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="muted" style="padding:1.5rem;">Could not load orders.</td></tr>`;
      return;
    }
    if (!orders.length){
      tbody.innerHTML = `<tr><td colspan="8" class="muted" style="padding:1.5rem;">No orders placed yet.</td></tr>`;
      return;
    }

    // Store orders for modal lookup
    const orderMap = {};
    orders.forEach(o => orderMap[o.id] = o);

    tbody.innerHTML = orders.map(o => {
      const itemList = (o.items||[]).map(i =>
        `<div style="font-size:.8rem; line-height:1.5;">
          <span style="font-weight:600;">${i.name}</span>
          <span class="muted"> × ${i.qty}${i.size ? " · " + i.size : ""}</span>
        </div>`).join("");
      return `
      <tr data-order-row="${o.id}">
        <td style="white-space:nowrap;">#${o.id}</td>
        <td style="white-space:nowrap;">${new Date(o.createdAt).toLocaleDateString()}</td>
        <td style="white-space:nowrap;">${o.customer ? o.customer.name : "—"}</td>
        <td style="white-space:nowrap;">${o.customer ? (o.customer.phone || "—") : "—"}</td>
        <td style="min-width:180px;">${itemList}</td>
        <td style="white-space:nowrap;">Rs. ${(o.total||0).toLocaleString()}</td>
        <td>
          <select class="order-status-select" data-order-id="${o.id}" style="text-transform:capitalize; padding:.4rem .6rem; border-radius:8px; border:1px solid rgba(0,0,53,.12);">
            ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s[0].toUpperCase()}${s.slice(1)}</option>`).join("")}
          </select>
        </td>
        <td><button class="btn btn-sm btn-outline" data-view-order="${o.id}" style="white-space:nowrap;">View</button></td>
      </tr>`;
    }).join("");

    tbody.querySelectorAll(".order-status-select").forEach(select => {
      select.addEventListener("change", async () => {
        const orderId = select.dataset.orderId;
        const newStatus = select.value;
        const previous = select.dataset.prevValue || newStatus;
        select.disabled = true;
        try {
          await window.CEApi.updateOrderStatus(orderId, newStatus);
          select.dataset.prevValue = newStatus;
          window.ceToast && window.ceToast(`Order #${orderId} marked as ${newStatus}`);
        } catch (err) {
          select.value = previous; // revert on failure
          window.ceToast && window.ceToast(err.message || "Could not update order status");
        } finally {
          select.disabled = false;
        }
      });
      select.dataset.prevValue = select.value;
    });

    tbody.querySelectorAll("[data-view-order]").forEach(btn => {
      btn.addEventListener("click", () => {
        const order = orderMap[btn.dataset.viewOrder];
        if (order) openOrderModal(order);
      });
    });
  }
})();
