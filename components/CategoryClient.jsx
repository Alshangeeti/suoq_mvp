"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";
import ProductListing from "./ProductListing";

// Category screen: subcategory photo circles on top, a category tree sidebar
// on the side (desktop), and the shared listing engine for products.
export default function CategoryClient({ cat, tree = [], imageMap, initialItems = null, initialTotal = 0, initialSub = "" }) {
  const { t, lang } = useStore();
  const [sub, setSub] = useState(initialSub || "");
  const [expanded, setExpanded] = useState(cat.slug);
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
        {sub && (
          <>
            <span className="mx-2">›</span>
            <span className="text-souq-green font-bold">
              {name(cat.subs.find((s) => s.slug === sub) || { ar: sub, fr: sub })}
            </span>
          </>
        )}
      </nav>

      <div className="flex gap-6 items-start">
        {/* Sidebar: all categories with expandable subcategory lists (desktop) */}
        <aside className="hidden md:block w-60 shrink-0 sticky top-20 bg-white rounded-2xl border border-souq-goldlight/60 py-2 max-h-[75vh] overflow-y-auto">
          {tree.map((c2) => {
            const isCurrent = c2.slug === cat.slug;
            const isOpen = expanded === c2.slug;
            return (
              <div key={c2.slug} className="border-b border-souq-goldlight/30 last:border-0">
                <div className="flex items-center">
                  <Link
                    href={`/category/${c2.slug}`}
                    className={`flex-1 px-4 py-2.5 text-sm font-bold ${isCurrent ? "text-souq-green" : "text-souq-ink/80 hover:text-souq-green"}`}
                  >
                    {name(c2)}
                  </Link>
                  {c2.subs.length > 0 && (
                    <button
                      onClick={() => setExpanded(isOpen ? "" : c2.slug)}
                      aria-label="expand"
                      className="px-3 py-2.5 text-souq-ink/40 font-bold"
                    >
                      {isOpen ? "−" : "+"}
                    </button>
                  )}
                </div>
                {isOpen && c2.subs.length > 0 && (
                  <div className="pb-2 ps-6">
                    {c2.subs.map((s2) =>
                      isCurrent ? (
                        <button
                          key={s2.slug}
                          onClick={() => setSub(sub === s2.slug ? "" : s2.slug)}
                          className={`block w-full text-start py-1.5 text-sm ${
                            sub === s2.slug ? "text-souq-green font-bold" : "text-souq-ink/60 hover:text-souq-green"
                          }`}
                        >
                          {name(s2)}
                        </button>
                      ) : (
                        <Link
                          key={s2.slug}
                          href={`/category/${c2.slug}?sub=${s2.slug}`}
                          className="block py-1.5 text-sm text-souq-ink/60 hover:text-souq-green"
                        >
                          {name(s2)}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-souq-green mb-5">{name(cat)}</h1>

          <div className="flex gap-3 overflow-x-auto pb-4 mb-2">
            {circle(t("all"), "", null, sub === "")}
            {cat.subs.map((s) => circle(name(s), s.slug, imageMap[s.slug] || null, sub === s.slug))}
          </div>

          <ProductListing
            cat={cat.slug}
            sub={sub}
            initialItems={sub === (initialSub || "") ? initialItems : null}
            initialTotal={initialTotal}
          />
        </div>
      </div>
    </div>
  );
}
