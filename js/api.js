/**
 * api.js
 * Thin fetch wrapper around the Express API. Every call is same-origin
 * (the frontend is served BY server.js), so no CORS config is needed.
 * `credentials: "include"` ensures the session cookie is sent so
 * express-session recognises logged-in requests.
 */
window.CEApi = (function () {
  "use strict";

  async function request(path, options = {}) {
    const res = await fetch(`/shop-api${path}`, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    // Products
    getProducts: (query = "") => request(`/products${query}`),
    getProduct: (id) => request(`/products/${id}`),
    createProduct: (body) => request(`/products`, { method: "POST", body }),
    updateProduct: (id, body) => request(`/products/${id}`, { method: "PUT", body }),
    deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

    // Auth
    register: (body) => request(`/auth/register`, { method: "POST", body }),
    login: (body) => request(`/auth/login`, { method: "POST", body }),
    logout: () => request(`/auth/logout`, { method: "POST" }),
    me: () => request(`/auth/me`),

    // Orders
    placeOrder: (body) => request(`/orders`, { method: "POST", body }),
    myOrders: () => request(`/orders`),
    updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: "PUT", body: { status } }),

    // Uploads
    uploadImage: (dataUrl) => request(`/upload`, { method: "POST", body: { data: dataUrl } }),

    // Reviews
    getReviews: (productId) => request(`/reviews/${productId}`),
    addReview: (productId, body) => request(`/reviews/${productId}`, { method: "POST", body }),

    // Admin
    adminLogin: (body) => request(`/admin/login`, { method: "POST", body }),
    adminLogout: () => request(`/admin/logout`, { method: "POST" }),
    adminSession: () => request(`/admin/session`),
    adminStats: () => request(`/admin/stats`),

    // Contact / newsletter
    sendContact: (body) => request(`/contact`, { method: "POST", body }),
    subscribeNewsletter: (email) => request(`/contact/newsletter`, { method: "POST", body: { email } }),
  };
})();
