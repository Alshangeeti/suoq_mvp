"use client";
// Wishlist stored client-side (works without an account). Stores small
// product snapshots so the /wishlist page renders instantly.
const KEY = "souq_wishlist";

export function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function isWished(id) {
  return getWishlist().some((x) => x.id === id);
}

export function toggleWish(product) {
  const list = getWishlist();
  const idx = list.findIndex((x) => x.id === product.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.unshift({
      id: product.id,
      nameAr: product.nameAr,
      nameFr: product.nameFr,
      priceMru: product.priceMru,
      imageUrl: product.imageUrl || null,
      emoji: product.emoji
    });
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
    window.dispatchEvent(new Event("souq-wishlist"));
  } catch {}
  return idx < 0;
}
