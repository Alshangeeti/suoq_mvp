"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";

export default function ProductCard({ p }) {
  const { t, lang, addToCart } = useStore();
  const [added, setAdded] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleAdd = () => {
    addToCart(p);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  };

  const name = lang === "ar" ? p.nameAr : p.nameFr;
  const desc = lang === "ar" ? p.descAr : p.descFr;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-souq-goldlight/60 overflow-hidden flex flex-col hover:border-souq-gold hover:shadow-md transition">
      <Link href={`/product/${p.id}`} className="block h-36 bg-gradient-to-br from-souq-green/10 to-souq-gold/20 flex items-center justify-center text-6xl overflow-hidden">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          p.emoji
        )}
      </Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <Link href={`/product/${p.id}`}>
          <h3 className="font-bold leading-snug hover:text-souq-green">{name}</h3>
        </Link>
        <p className="text-sm text-souq-ink/60 flex-1">{desc}</p>
        <span
          className={`text-xs font-semibold rounded-full px-2 py-0.5 w-fit ${
            p.stocked ? "bg-souq-green/10 text-souq-green" : "bg-souq-gold/20 text-souq-deep"
          }`}
        >
          {p.stocked ? t("stocked") : t("onDemand")}
        </span>
        <div className="flex items-center justify-between mt-1">
          <span className="font-black text-souq-green text-lg">
            {p.priceMru.toLocaleString()} <span className="text-xs">{t("mru")}</span>
          </span>
          <button
            onClick={handleAdd}
            className={`text-sm font-bold rounded-full px-4 py-1.5 transition ${
              added
                ? "bg-souq-gold text-souq-deep"
                : "bg-souq-green text-white hover:bg-souq-deep"
            }`}
          >
            {added ? t("added") : t("addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
