"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { dict } from "./i18n";

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [lang, setLang] = useState("ar");
  const [cart, setCart] = useState([]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("souq_cart");
      const savedLang = localStorage.getItem("souq_lang");
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedLang) setLang(savedLang);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("souq_cart", JSON.stringify(cart)); } catch {}
  }, [cart]);

  useEffect(() => {
    try { localStorage.setItem("souq_lang", lang); } catch {}
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
    <Ctx.Provider value={{ lang, setLang, t, cart, addToCart, setQty, clearCart, total, count }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
