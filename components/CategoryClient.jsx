"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";
import ProductListing from "./ProductListing";

// Category screen: subcategory photo circles on top, the shared listing
// engine (sort/filter/pagination) below.
export default function CategoryClient({ cat, imageMap, initialItems = null, initialTotal = 0 }) {
  const { t, lang } = useStore();
  const [sub, setSub] = useState("");
  const name = (item) => (lang === "ar" ? item.ar : item.fr);

  const circle = (label, slug, imageUrl, selected) => (
    <button
      key={slug || "all"}
      onClick={() => setSub(slug)}
      className="flex flex-col items-center gap-2 shrink-0 w-24"
    >
      <span
        className={`w-20 h-20 rounded-full overflow-hidden border-4 transition flex items-center justify-center bg-white ${
          selected ? "border-souq-green" : "border-souq-goldlight/60"
        }`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={label} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-black text-souq-green">{label.slice(0, 1)}</span>
        )}
      </span>
      <span className={`text-xs font-bold text-center leading-tight ${selected ? "text-souq-green" : "text-souq-ink/70"}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="py-6">
      <nav className="text-sm text-souq-ink/60 mb-4" aria-label="breadcrumb">
        <Link href="/" className="hover:text-souq-green font-bold">{t("homeCrumb")}</Link>
        <span className="mx-2">›</span>
        <span className="text-souq-ink font-bold">{name(cat)}</span>
      </nav>

      <h1 className="text-2xl font-black text-souq-green mb-5">{name(cat)}</h1>

      <div className="flex gap-3 overflow-x-auto pb-4 mb-2">
        {circle(t("all"), "", null, sub === "")}
        {cat.subs.map((s) => circle(name(s), s.slug, imageMap[s.slug] || null, sub === s.slug))}
      </div>

      <ProductListing
        cat={cat.slug}
        sub={sub}
        initialItems={sub === "" ? initialItems : null}
        initialTotal={initialTotal}
      />
    </div>
  );
}
