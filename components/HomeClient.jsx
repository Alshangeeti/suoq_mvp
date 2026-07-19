"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";
import ProductListing from "./ProductListing";

export default function HomeClient({ tree = [], initialItems = null, initialTotal = 0, initialQuery = "" }) {
  const { t, lang } = useStore();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQ, setDebouncedQ] = useState(initialQuery);
  const catName = (item) => (lang === "ar" ? item.ar : item.fr);

  useEffect(() => {
    setQuery(initialQuery);
    setDebouncedQ(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(query.trim()), 400);
    return () => clearTimeout(id);
  }, [query]);

  const useInitial = debouncedQ === initialQuery;

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
        {tree.map((c2) => (
          <Link
            key={c2.slug}
            href={`/category/${c2.slug}`}
            className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold border transition bg-white text-souq-ink border-souq-goldlight hover:border-souq-gold hover:text-souq-green"
          >
            {catName(c2)}
          </Link>
        ))}
      </div>

      <ProductListing
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
