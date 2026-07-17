"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";
import { thumb } from "../lib/img";
import { isWished, toggleWish } from "../lib/wishlist";

export default function ProductCard({ p }) {
  const { t, lang, addToCart } = useStore();
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    setWished(isWished(p.id));
    const sync = () => setWished(isWished(p.id));
    window.addEventListener("souq-wishlist", sync);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("souq-wishlist", sync);
    };
  }, [p.id]);

  const handleAdd = () => {
    addToCart(p);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  };

  const name = lang === "ar" ? p.nameAr : p.nameFr;
  const hasDiscount = p.originalPriceMru && p.originalPriceMru > p.priceMru;
  const discountPct = hasDiscount
    ? Math.round(((p.originalPriceMru - p.priceMru) / p.originalPriceMru) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-souq-goldlight/50 overflow-hidden flex flex-col hover:border-souq-gold hover:shadow-md transition relative">
      <button
        onClick={() => setWished(toggleWish(p))}
        aria-label={t("wishlist")}
        className="absolute top-2 end-2 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill={wished ? "#C9302C" : "none"} stroke={wished ? "#C9302C" : "#666"} strokeWidth="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </button>

      {hasDiscount && (
        <span className="absolute top-2 start-2 z-10 bg-red-600 text-white text-[11px] font-black rounded-md px-1.5 py-0.5">
          -{discountPct}%
        </span>
      )}

      <Link href={`/product/${p.id}`} className="block aspect-square bg-gradient-to-br from-souq-green/5 to-souq-gold/10 flex items-center justify-center text-5xl overflow-hidden">
        {p.imageUrl ? (
          <img src={thumb(p.imageUrl)} alt={name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          p.emoji
        )}
      </Link>

      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <Link href={`/product/${p.id}`}>
          <h3 className="font-bold text-sm leading-snug line-clamp-2 hover:text-souq-green min-h-[2.4em]">{name}</h3>
        </Link>

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-black text-souq-green">
            {p.priceMru.toLocaleString()} <span className="text-[10px]">{t("mru")}</span>
          </span>
          {hasDiscount && (
            <span className="text-xs text-souq-ink/40 line-through">
              {p.originalPriceMru.toLocaleString()}
            </span>
          )}
        </div>

        <span className={`text-[11px] font-bold ${p.stocked ? "text-souq-green" : "text-souq-deep/70"}`}>
          {p.stocked ? t("deliveryShortStocked") : t("deliveryShortOnDemand")}
        </span>

        <button
          onClick={handleAdd}
          className={`mt-auto w-full text-xs font-bold rounded-full py-1.5 transition ${
            added ? "bg-souq-gold text-souq-deep" : "bg-souq-green text-white hover:bg-souq-deep"
          }`}
        >
          {added ? t("added") : t("addToCart")}
        </button>
      </div>
    </div>
  );
}
