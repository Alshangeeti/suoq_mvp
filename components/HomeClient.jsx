"use client";
import { useState } from "react";
import { useStore } from "../lib/store";
import ProductCard from "./ProductCard";

const CATS = ["all", "electronics", "home", "fashion", "beauty"];

export default function HomeClient({ products = [], loadError = false }) {
  const { t } = useStore();
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");

  const byCat = cat === "all" ? products : products.filter((p) => p.category === cat);
  const q = query.trim().toLowerCase();
  const shown = !q
    ? byCat
    : byCat.filter((p) =>
        [p.nameAr, p.nameFr, p.descAr, p.descFr]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(q))
      );

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

      <div className="flex gap-2 overflow-x-auto py-4">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold border transition ${
              cat === c
                ? "bg-souq-green text-white border-souq-green"
                : "bg-white text-souq-ink border-souq-goldlight hover:border-souq-gold"
            }`}
          >
            {t(c)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {shown.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      {shown.length === 0 && products.length > 0 && (
        <p className="text-center text-souq-ink/50 py-10">{t("noResults")}</p>
      )}
      {loadError && (
        <div className="text-center py-10">
          <p className="text-souq-ink/60 font-bold mb-3">{t("loadError")}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-souq-green text-white font-bold rounded-full px-6 py-2"
          >
            {t("retry")}
          </button>
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-black text-souq-green mb-4">{t("trust")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-souq-goldlight/60 p-5">
              <h3 className="font-bold text-souq-deep">{t(`trust${n}T`)}</h3>
              <p className="text-sm text-souq-ink/60 mt-1">{t(`trust${n}D`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
