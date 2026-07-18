"use client";
import Link from "next/link";
import { useStore } from "../../lib/store";
import { thumb } from "../../lib/img";

export default function CartPage() {
  const { t, lang, cart, setQty, total } = useStore();

  if (cart.length === 0)
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🛒</p>
        <p className="font-bold text-lg">{t("emptyCart")}</p>
        <Link href="/" className="inline-block mt-4 bg-souq-green text-white rounded-full px-6 py-2 font-bold">
          {t("shopNow")}
        </Link>
      </div>
    );

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-souq-green mb-5">{t("cart")}</h1>
      <div className="space-y-3">
        {cart.map((i) => {
          const k = i.key || `${i.id}|${i.skuAttr || ""}`;
          return (
          <div key={k} className="bg-white rounded-2xl border border-souq-goldlight/60 p-3 flex items-center gap-3">
            {i.imageUrl ? (
              <img src={thumb(i.imageUrl, 150)} alt="" loading="lazy" className="w-14 h-14 rounded-lg object-cover shrink-0" />
            ) : (
              <span className="text-2xl w-14 text-center shrink-0">{i.emoji}</span>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-snug line-clamp-2">{lang === "ar" ? i.nameAr : i.nameFr}</p>
              {i.variantLabel && (
                <p className="text-[11px] text-souq-ink/60 font-bold">{i.variantLabel}</p>
              )}
              <p className="text-sm text-souq-green font-bold">
                {i.priceMru.toLocaleString()} {t("mru")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(k, i.qty - 1)} aria-label="decrease quantity" className="w-7 h-7 rounded-full bg-souq-sand font-bold text-sm">−</button>
              <span className="w-5 text-center font-bold text-sm">{i.qty}</span>
              <button onClick={() => setQty(k, i.qty + 1)} aria-label="increase quantity" className="w-7 h-7 rounded-full bg-souq-sand font-bold text-sm">+</button>
            </div>
          </div>
          );
        })}
      </div>
      <div className="mt-6 bg-souq-green text-white rounded-2xl p-5 flex items-center justify-between">
        <span className="font-bold">{t("total")}</span>
        <span className="font-black text-xl">{total.toLocaleString()} {t("mru")}</span>
      </div>
      <Link
        href="/checkout"
        className="block text-center mt-4 bg-souq-gold text-souq-deep font-black rounded-full py-3 hover:brightness-105 transition"
      >
        {t("checkout")}
      </Link>
    </div>
  );
}
