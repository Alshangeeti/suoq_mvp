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

  const addToCart = (product) =>
    setCart((c) => {
      const found = c.find((i) => i.id === product.id);
      if (found) return c.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: product.id, nameAr: product.nameAr, nameFr: product.nameFr, priceMru: product.priceMru, emoji: product.emoji, qty: 1 }];
    });

  const setQty = (id, qty) =>
    setCart((c) => (qty <= 0 ? c.filter((i) => i.id !== id) : c.map((i) => (i.id === id ? { ...i, qty } : i))));

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
