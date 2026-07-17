"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";
import ProductCard from "./ProductCard";
import RecentlyViewed from "./RecentlyViewed";

function ProductGallery({ product, name }) {
  let images = [];
  try {
    images = JSON.parse(product.imagesJson || "[]");
  } catch {}
  if (product.imageUrl && !images.includes(product.imageUrl)) images.unshift(product.imageUrl);
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="bg-gradient-to-br from-souq-green/10 to-souq-gold/20 rounded-3xl flex items-center justify-center text-[10rem] min-h-[280px]">
        {product.emoji}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-3xl border border-souq-goldlight/60 overflow-hidden min-h-[280px] flex items-center justify-center">
        <img src={images[active]} alt={name} className="w-full h-full object-contain max-h-[380px]" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {images.map((u, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${i === active ? "border-souq-green" : "border-souq-goldlight/60"}`}
              aria-label={`image ${i + 1}`}
            >
              <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailClient({ product, related, catInfo }) {
  const { t, lang, addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef(null);

  const name = lang === "ar" ? product.nameAr : product.nameFr;
  const desc = lang === "ar" ? product.descAr : product.descFr;

  // Record this product in the "recently viewed" list.
  useEffect(() => {
    try {
      const key = "souq_recent";
      const list = JSON.parse(localStorage.getItem(key) || "[]").filter((x) => x.id !== product.id);
      list.unshift({
        id: product.id,
        nameAr: product.nameAr,
        nameFr: product.nameFr,
        emoji: product.emoji,
        priceMru: product.priceMru
      });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 8)));
    } catch {}
    return () => clearTimeout(timer.current);
  }, [product.id]);

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  };

  const addButton = (extra = "") => (
    <button
      onClick={handleAdd}
      className={`font-black rounded-full py-3 px-8 transition ${extra} ${
        added ? "bg-souq-gold text-souq-deep" : "bg-souq-green text-white hover:bg-souq-deep"
      }`}
    >
      {added ? t("added") : t("addToCart")}
    </button>
  );

  return (
    <div className="py-6 pb-28 md:pb-6">
      <nav className="text-sm text-souq-ink/60 mb-4" aria-label="breadcrumb">
        <Link href="/" className="hover:text-souq-green font-bold">{t("homeCrumb")}</Link>
        <span className="mx-2">›</span>
        <Link href={`/category/${product.category}`} className="hover:text-souq-green font-bold">
          {catInfo ? (lang === "ar" ? catInfo.ar : catInfo.fr) : product.category}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-souq-ink font-bold">{name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6">
        <ProductGallery product={product} name={name} />

        <div>
          <h1 className="text-2xl md:text-3xl font-black leading-snug">{name}</h1>
          <p className="mt-3 text-souq-ink/70">{desc}</p>

          <p className="mt-5 font-black text-souq-green text-4xl">
            {product.priceMru.toLocaleString()} <span className="text-base">{t("mru")}</span>
          </p>

          <p className={`mt-3 text-sm font-bold rounded-full px-3 py-1 w-fit ${
            product.stocked ? "bg-souq-green/10 text-souq-green" : "bg-souq-gold/20 text-souq-deep"
          }`}>
            {product.stocked ? t("stocked") : t("onDemand")}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white border border-souq-goldlight rounded-full px-2 py-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="decrease quantity" className="w-8 h-8 rounded-full bg-souq-sand font-bold">−</button>
              <span className="w-6 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(Math.min(99, qty + 1))} aria-label="increase quantity" className="w-8 h-8 rounded-full bg-souq-sand font-bold">+</button>
            </div>
            <div className="hidden md:block">{addButton()}</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-black text-xl mb-4">{t("related")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />

      {/* Sticky add-to-cart bar on mobile */}
      <div className="md:hidden fixed bottom-14 inset-x-0 bg-white/95 backdrop-blur border-t border-souq-goldlight/60 px-4 py-3 flex items-center justify-between gap-3 z-30">
        <span className="font-black text-souq-green text-xl">
          {(product.priceMru * qty).toLocaleString()} <span className="text-xs">{t("mru")}</span>
        </span>
        {addButton("flex-1 text-center")}
      </div>
    </div>
  );
}
