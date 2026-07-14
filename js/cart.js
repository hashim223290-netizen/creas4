/**
 * cart.js
 * Cart state lives in localStorage under "ce_cart" as an array of
 * { id, size, color, qty }. Exposed on window.CreaseEditsCart so any page
 * (header badge, cart page, checkout) can read/write the same state.
 * When the backend arrives, only the storage layer here needs to change
 * (e.g. swap localStorage reads for a /api/cart call) — the call sites stay put.
 */
(function(){
  "use strict";
  const KEY = "ce_cart";

  function read(){
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch(e){ return []; }
  }
  function write(items){
    localStorage.setItem(KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("cart:updated"));
  }
  function findProduct(id){
    return (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).find(p => p.id === id);
  }

  function add(id, size, color, qty){
    qty = qty || 1;
    const items = read();
    const existing = items.find(i => i.id === id && i.size === size && i.color === color);
    if (existing) existing.qty += qty;
    else items.push({ id, size: size || null, color: color || null, qty });
    write(items);
  }
  function updateQty(index, qty){
    const items = read();
    if (!items[index]) return;
    if (qty <= 0) items.splice(index,1);
    else items[index].qty = qty;
    write(items);
  }
  function remove(index){
    const items = read();
    items.splice(index,1);
    write(items);
  }
  function clear(){ write([]); }
  function count(){ return read().reduce((sum,i) => sum + i.qty, 0); }

  function lines(){
    return read().map((item, index) => {
      const product = findProduct(item.id);
      return { index, item, product, lineTotal: product ? product.price * item.qty : 0 };
    }).filter(l => l.product);
  }
  function subtotal(){
    return lines().reduce((sum,l) => sum + l.lineTotal, 0);
  }

  window.CreaseEditsCart = { add, updateQty, remove, clear, count, lines, subtotal, read };
})();
