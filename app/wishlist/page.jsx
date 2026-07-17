"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "../../lib/store";
import { getWishlist, toggleWish } from "../../lib/wishlist";
import { thumb } from "../../lib/img";

export default function WishlistPage() {
  const { t, lang } = useStore();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getWishlist());
    const sync = () => setItems(getWishlist());
    window.addEventListener("souq-wishlist", sync);
    return () => window.removeEventListener("souq-wishlist", sync);
  }, []);

  if (items.length === 0)
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">♡</p>
        <p className="font-bold text-lg">{t("emptyWishlist")}</p>
        <Link href="/" className="inline-block mt-4 bg-souq-green text-white rounded-full px-6 py-2 font-bold">
          {t("shopNow")}
        </Link>
      </div>
    );

  return (
    <div className="py-8">
      <h1 className="text-2xl font-black text-souq-green mb-5">{t("wishlist")}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-souq-goldlight/50 overflow-hidden relative">
            <button
              onClick={() => toggleWish(p)}
              aria-label="remove"
              className="absolute top-2 end-2 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-red-600 font-bold"
            >
              ×
            </button>
            <Link href={`/product/${p.id}`} className="block aspect-square bg-souq-sand flex items-center justify-center text-5xl overflow-hidden">
              {p.imageUrl ? (
                <img src={thumb(p.imageUrl)} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                p.emoji
              )}
            </Link>
            <div className="p-2.5">
              <Link href={`/product/${p.id}`}>
                <p className="font-bold text-sm leading-snug line-clamp-2">{lang === "ar" ? p.nameAr : p.nameFr}</p>
              </Link>
              <p className="font-black text-souq-green mt-1">
                {p.priceMru.toLocaleString()} <span className="text-[10px]">{t("mru")}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
