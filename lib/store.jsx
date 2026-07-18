"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { dict } from "./i18n";

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [lang, setLang] = useState("ar");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const ready = useRef(false);

  // Load whatever's in localStorage first (fast, works offline/logged-out),
  // then check the server for a logged-in customer and reconcile: if they
  // have a saved cart, use it; otherwise adopt the local guest cart into
  // their account.
  useEffect(() => {
    let localCart = [];
    try {
      const savedCart = localStorage.getItem("souq_cart");
      const savedLang = localStorage.getItem("souq_lang");
      if (savedCart) localCart = JSON.parse(savedCart);
      if (savedLang) setLang(savedLang);
      if (localCart.length) setCart(localCart);
    } catch {}

    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => {
        if (data.customer) {
          setCustomer(data.customer);
          if (data.cart && data.cart.length > 0) {
            setCart(data.cart);
          } else if (localCart.length > 0) {
            fetch("/api/cart", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cart: localCart })
            }).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        ready.current = true;
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("souq_cart", JSON.stringify(cart));
    } catch {}
    if (ready.current && customer) {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart })
      }).catch(() => {});
    }
  }, [cart, customer]);

  useEffect(() => {
    try {
      localStorage.setItem("souq_lang", lang);
    } catch {}
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = (k) => dict[lang][k] || k;

  // Cart items are keyed by product + chosen variant, so two colors of the
  // same product are separate lines.
  const itemKey = (id, skuAttr) => `${id}|${skuAttr || ""}`;

  const addToCart = (product, qty = 1, variant = null) =>
    setCart((c) => {
      const n = Math.max(1, Math.min(99, qty | 0));
      const key = itemKey(product.id, variant && variant.attr);
      const found = c.find((i) => (i.key || itemKey(i.id, i.skuAttr)) === key);
      if (found)
        return c.map((i) =>
          (i.key || itemKey(i.id, i.skuAttr)) === key ? { ...i, qty: Math.min(99, i.qty + n) } : i
        );
      return [
        ...c,
        {
          key,
          id: product.id,
          nameAr: product.nameAr,
          nameFr: product.nameFr,
          priceMru: product.priceMru,
          emoji: product.emoji,
          imageUrl: (variant && variant.image) || product.imageUrl || null,
          skuAttr: variant ? variant.attr : null,
          variantLabel: variant ? variant.label : null,
          qty: n
        }
      ];
    });

  const setQty = (key, qty) =>
    setCart((c) => {
      const k = (i) => i.key || itemKey(i.id, i.skuAttr);
      return qty <= 0 ? c.filter((i) => k(i) !== key) : c.map((i) => (k(i) === key ? { ...i, qty } : i));
    });

  const clearCart = () => setCart([]);
  const total = cart.reduce((s, i) => s + i.priceMru * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <Ctx.Provider
      value={{ lang, setLang, t, cart, addToCart, setQty, clearCart, total, count, customer, setCustomer }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
