/**
 * auth.js
 * Talks to /api/auth/* (see routes/auth.js). Sessions are cookie-based via
 * express-session, so once login/register succeeds the browser is already
 * authenticated for subsequent requests — nothing extra to store client-side.
 */
(function(){
  "use strict";

  function showFieldError(field, message){
    field.closest(".form-field").classList.toggle("has-error", !!message);
    const err = field.closest(".form-field").querySelector(".error");
    if (err) err.textContent = message || "";
  }
  function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  document.addEventListener("components:ready", () => {
    wireLogin();
    wireRegister();
    wireProfile();
    reflectAccountLink();
  });

  async function reflectAccountLink(){
    const link = document.getElementById("accountLink");
    if (!link || !window.CEApi) return;
    try {
      const { user } = await window.CEApi.me();
      link.setAttribute("href", "profile.html");
      link.setAttribute("title", `Signed in as ${user.name}`);
    } catch (err) {
      // not signed in — leave the default link to login.html
    }
  }

  function wireLogin(){
    const form = document.getElementById("loginForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.querySelector("#loginEmail");
      const password = form.querySelector("#loginPassword");
      let ok = true;
      if (!validEmail(email.value)){ showFieldError(email, "Enter a valid email address."); ok = false; } else showFieldError(email, "");
      if (password.value.length < 6){ showFieldError(password, "Password must be at least 6 characters."); ok = false; } else showFieldError(password, "");
      if (!ok) return;

      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await window.CEApi.login({ email: email.value, password: password.value });
        window.ceToast && window.ceToast("Signed in — welcome back");
        setTimeout(() => location.href = "profile.html", 400);
      } catch (err) {
        showFieldError(password, err.message);
        btn.disabled = false;
      }
    });
  }

  function wireRegister(){
    const form = document.getElementById("registerForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.querySelector("#registerName");
      const email = form.querySelector("#registerEmail");
      const password = form.querySelector("#registerPassword");
      const confirm = form.querySelector("#registerConfirm");
      let ok = true;
      if (name.value.trim().length < 2){ showFieldError(name, "Enter your full name."); ok=false; } else showFieldError(name,"");
      if (!validEmail(email.value)){ showFieldError(email, "Enter a valid email address."); ok=false; } else showFieldError(email,"");
      if (password.value.length < 6){ showFieldError(password, "Use at least 6 characters."); ok=false; } else showFieldError(password,"");
      if (confirm.value !== password.value){ showFieldError(confirm, "Passwords don't match."); ok=false; } else showFieldError(confirm,"");
      if (!ok) return;

      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await window.CEApi.register({ name: name.value, email: email.value, password: password.value });
        window.ceToast && window.ceToast("Account created");
        setTimeout(() => location.href = "profile.html", 400);
      } catch (err) {
        showFieldError(email, err.message);
        btn.disabled = false;
      }
    });
  }

  async function wireProfile(){
    const wrap = document.getElementById("profileWrap");
    if (!wrap) return;

    let me;
    try {
      const res = await window.CEApi.me();
      me = res.user;
    } catch (err) {
      location.href = "login.html";
      return;
    }

    document.getElementById("profileName").textContent = me.name;
    document.getElementById("profileEmail").textContent = me.email;
    document.getElementById("profileInitial").textContent = me.name.charAt(0).toUpperCase();
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await window.CEApi.logout();
      location.href = "login.html";
    });

    const orders = document.getElementById("orderHistory");
    try {
      const { orders: list } = await window.CEApi.myOrders();
      if (!list.length){
        orders.innerHTML = `<p class="muted">No orders yet — once you check out, they'll appear here.</p>`;
      } else {
        orders.innerHTML = list.map(o => `
          <div class="glass-card" style="padding:1.2rem 1.5rem;margin-bottom:1rem;">
            <div class="flex justify-between"><strong>Order #${o.id}</strong><span class="muted">${new Date(o.createdAt).toLocaleDateString()}</span></div>
            <div class="muted">${o.items.reduce((s,i)=>s+i.qty,0)} item(s) — $${o.total.toFixed(2)} · <span style="text-transform:capitalize;">${o.status}</span></div>
          </div>`).join("");
      }
    } catch (err) {
      orders.innerHTML = `<p class="muted">Could not load order history.</p>`;
    }
  }
})();
