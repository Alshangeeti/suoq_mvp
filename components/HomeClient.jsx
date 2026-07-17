"use client";
import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import ProductListing from "./ProductListing";

export default function HomeClient({ tree = [], initialItems = null, initialTotal = 0, initialCat = "all", initialSub = "", initialQuery = "" }) {
  const { t, lang } = useStore();
  const [cat, setCat] = useState(tree.some((x) => x.slug === initialCat) ? initialCat : "all");
  const [sub, setSub] = useState(initialSub || "");
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQ, setDebouncedQ] = useState(initialQuery);
  const catName = (item) => (lang === "ar" ? item.ar : item.fr);
  const activeTree = tree.find((x) => x.slug === cat);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(query.trim()), 400);
    return () => clearTimeout(id);
  }, [query]);

  const catUnchanged = cat === (tree.some((x) => x.slug === initialCat) ? initialCat : "all");
  const useInitial = catUnchanged && sub === (initialSub || "") && debouncedQ === initialQuery;

  return (
    <div>
      <section className="relative bg-souq-green text-white rounded-b-3xl -mx-4 px-6 py-12 overflow-hidden">
        <span className="absolute -top-10 -end-6 text-[14rem] leading-none text-souq-gold/10 font-black select-none pointer-events-none">
          س
        </span>
        <h1 className="text-3xl md:text-4xl font-black max-w-lg leading-snug">
          {t("tagline")}
        </h1>
        <p className="mt-3 max-w-md text-white/85">{t("sub")}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          {["heroBadge1", "heroBadge2", "heroBadge3"].map((b) => (
            <span key={b} className="bg-souq-gold text-souq-deep rounded-full px-3 py-1">
              {t(b)}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="w-full rounded-full border border-souq-goldlight bg-white px-5 py-2.5 focus:outline-none focus:border-souq-green shadow-sm"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-4">
        <button
          onClick={() => { setCat("all"); setSub(""); }}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold border transition ${
            cat === "all"
              ? "bg-souq-green text-white border-souq-green"
              : "bg-white text-souq-ink border-souq-goldlight hover:border-souq-gold"
          }`}
        >
          {t("all")}
        </button>
        {tree.map((c2) => (
          <button
            key={c2.slug}
            onClick={() => { setCat(c2.slug); setSub(""); }}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold border transition ${
              cat === c2.slug
                ? "bg-souq-green text-white border-souq-green"
                : "bg-white text-souq-ink border-souq-goldlight hover:border-souq-gold"
            }`}
          >
            {catName(c2)}
          </button>
        ))}
      </div>

      {activeTree && activeTree.subs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 -mt-1">
          {activeTree.subs.map((s2) => (
            <button
              key={s2.slug}
              onClick={() => setSub(sub === s2.slug ? "" : s2.slug)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold border transition ${
                sub === s2.slug
                  ? "bg-souq-gold text-souq-deep border-souq-gold"
                  : "bg-white text-souq-ink/70 border-souq-goldlight/60"
              }`}
            >
              {catName(s2)}
            </button>
          ))}
        </div>
      )}

      <ProductListing
        cat={cat === "all" ? "" : cat}
        sub={sub}
        q={debouncedQ}
        initialItems={useInitial ? initialItems : null}
        initialTotal={initialTotal}
      />

      <section className="mt-12">
        <h2 className="text-xl font-black text-souq-green text-center mb-6">{t("trust")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-souq-goldlight/60 p-5 text-center">
              <h3 className="font-black text-souq-green">{t(`trust${i}T`)}</h3>
              <p className="mt-1 text-sm text-souq-ink/70">{t(`trust${i}D`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
