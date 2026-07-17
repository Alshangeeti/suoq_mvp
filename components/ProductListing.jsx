"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import ProductCard from "./ProductCard";

// Shared listing engine (home, category pages, search): server-side
// filtering/sorting/pagination via /api/products/list, "load more" paging,
// result counts, price + availability filters.
export default function ProductListing({ cat = "", sub = "", q = "", initialItems = null, initialTotal = 0 }) {
  const { t } = useStore();
  const [items, setItems] = useState(initialItems || []);
  const [total, setTotal] = useState(initialItems ? initialTotal : 0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(initialItems ? Math.ceil(initialTotal / 24) : 0);
  const [loading, setLoading] = useState(!initialItems);
  const [error, setError] = useState(false);

  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [applied, setApplied] = useState({ min: "", max: "" });
  const [stocked, setStocked] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const firstRun = useRef(true);

  const buildParams = (pageNum) => {
    const params = new URLSearchParams();
    if (cat) params.set("cat", cat);
    if (sub) params.set("sub", sub);
    if (q) params.set("q", q);
    params.set("sort", sort);
    if (applied.min) params.set("min", applied.min);
    if (applied.max) params.set("max", applied.max);
    if (stocked === "stocked") params.set("stocked", "1");
    if (stocked === "ondemand") params.set("stocked", "0");
    params.set("page", String(pageNum));
    return params;
  };

  const fetchPage = async (pageNum, append) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/products/list?${buildParams(pageNum)}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error("failed");
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firstRun.current && initialItems) {
      firstRun.current = false;
      return;
    }
    firstRun.current = false;
    fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, sub, q, sort, applied.min, applied.max, stocked]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm font-bold text-souq-ink/60">
          {total.toLocaleString()} {t("productCount")}
        </span>
        <div className="flex-1" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm font-bold rounded-full border border-souq-goldlight bg-white px-3 py-1.5"
          aria-label="sort"
        >
          <option value="newest">{t("sortNewest")}</option>
          <option value="price_asc">{t("sortPriceAsc")}</option>
          <option value="price_desc">{t("sortPriceDesc")}</option>
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`text-sm font-bold rounded-full border px-3 py-1.5 ${
            showFilters || applied.min || applied.max || stocked !== "all"
              ? "bg-souq-green text-white border-souq-green"
              : "bg-white border-souq-goldlight"
          }`}
        >
          {t("filters")}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-souq-goldlight/60 p-4 mb-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-bold block mb-1">{t("priceFrom")} ({t("mru")})</span>
            <input
              type="number"
              dir="ltr"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-28 rounded-xl border border-souq-goldlight px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold block mb-1">{t("priceTo")}</span>
            <input
              type="number"
              dir="ltr"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-28 rounded-xl border border-souq-goldlight px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold block mb-1">{t("availability")}</span>
            <select
              value={stocked}
              onChange={(e) => setStocked(e.target.value)}
              className="rounded-xl border border-souq-goldlight bg-white px-3 py-1.5 text-sm font-bold"
            >
              <option value="all">{t("availAll")}</option>
              <option value="stocked">{t("availStocked")}</option>
              <option value="ondemand">{t("availOnDemand")}</option>
            </select>
          </label>
          <button
            onClick={() => setApplied({ min: minPrice, max: maxPrice })}
            className="text-sm font-bold bg-souq-green text-white rounded-full px-5 py-2"
          >
            {t("apply")}
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-2.5" aria-busy="true">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-souq-goldlight/40 overflow-hidden animate-pulse">
              <div className="aspect-square bg-souq-goldlight/20" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 bg-souq-goldlight/30 rounded w-3/4" />
                <div className="h-4 bg-souq-goldlight/30 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <p className="text-center text-souq-ink/50 py-16">{t("noResults")}</p>
      )}

      {error && (
        <div className="text-center py-10">
          <p className="text-souq-ink/60 font-bold mb-3">{t("loadError")}</p>
          <button onClick={() => fetchPage(1, false)} className="bg-souq-green text-white font-bold rounded-full px-6 py-2">
            {t("retry")}
          </button>
        </div>
      )}

      {!loading && page < pages && (
        <div className="text-center mt-6">
          <button
            onClick={() => fetchPage(page + 1, true)}
            className="bg-white border-2 border-souq-green text-souq-green font-bold rounded-full px-8 py-2.5 hover:bg-souq-green hover:text-white transition"
          >
            {t("loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
