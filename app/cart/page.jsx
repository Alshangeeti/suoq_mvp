"use client";
import Link from "next/link";
import { useStore } from "../../lib/store";

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
        {cart.map((i) => (
          <div key={i.id} className="bg-white rounded-2xl border border-souq-goldlight/60 p-4 flex items-center gap-4">
            <span className="text-3xl">{i.emoji}</span>
            <div className="flex-1">
              <p className="font-bold">{lang === "ar" ? i.nameAr : i.nameFr}</p>
              <p className="text-sm text-souq-green font-bold">
                {i.priceMru.toLocaleString()} {t("mru")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(i.id, i.qty - 1)} className="w-8 h-8 rounded-full bg-souq-sand font-bold">−</button>
              <span className="w-6 text-center font-bold">{i.qty}</span>
              <button onClick={() => setQty(i.id, i.qty + 1)} className="w-8 h-8 rounded-full bg-souq-sand font-bold">+</button>
            </div>
          </div>
        ))}
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
