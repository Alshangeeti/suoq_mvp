"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";

export default function RecentlyViewed({ excludeId }) {
  const { t, lang } = useStore();
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("souq_recent") || "[]");
      setItems(list.filter((x) => x.id !== excludeId).slice(0, 8));
    } catch {}
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-black text-xl mb-4">{t("recentlyViewed")}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="shrink-0 w-36 bg-white rounded-2xl border border-souq-goldlight/60 p-3 hover:border-souq-gold transition"
          >
            <div className="text-4xl text-center py-3">{p.emoji}</div>
            <p className="text-xs font-bold leading-snug line-clamp-2">{lang === "ar" ? p.nameAr : p.nameFr}</p>
            <p className="text-sm font-black text-souq-green mt-1">
              {p.priceMru.toLocaleString()} <span className="text-[10px]">{t("mru")}</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
