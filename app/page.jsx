"use client";
import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import ProductCard from "../components/ProductCard";

const CATS = ["all", "electronics", "home", "fashion", "beauty"];

export default function Home() {
  const { t } = useStore();
  const [products, setProducts] = useState([]);
  const [cat, setCat] = useState("all");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => {});
  }, []);

  const shown = cat === "all" ? products : products.filter((p) => p.category === cat);

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

      <div className="flex gap-2 overflow-x-auto py-5">
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
