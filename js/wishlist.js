/**
 * wishlist.js
 * Wishlist state lives in localStorage under "ce_wishlist" as an array of
 * product ids. Same swap-later-for-API pattern as cart.js.
 */
(function(){
  "use strict";
  const KEY = "ce_wishlist";

  function read(){
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch(e){ return []; }
  }
  function write(ids){
    localStorage.setItem(KEY, JSON.stringify(ids));
    document.dispatchEvent(new CustomEvent("wishlist:updated"));
  }
  function has(id){ return read().includes(id); }
  function toggle(id){
    let ids = read();
    if (ids.includes(id)) ids = ids.filter(x => x !== id);
    else ids.push(id);
    write(ids);
    return ids.includes(id);
  }
  function remove(id){
    write(read().filter(x => x !== id));
  }
  function count(){ return read().length; }
  function products(){
    const all = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
    return read().map(id => all.find(p => p.id === id)).filter(Boolean);
  }

  window.CreaseEditsWishlist = { has, toggle, remove, count, products, read };
})();
