"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../lib/store";
import AccountIcon from "./AccountIcon";
import HeaderCategoryMenu from "./HeaderCategoryMenu";
import { useEffect } from "react";
import { getWishlist } from "../lib/wishlist";

export default function Header() {
  const { t, lang, setLang, count, customer } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [wishCount, setWishCount] = useState(0);
  useEffect(() => {
    const sync = () => setWishCount(getWishlist().length);
    sync();
    window.addEventListener("souq-wishlist", sync);
    return () => window.removeEventListener("souq-wishlist", sync);
  }, []);
  const submitSearch = (e) => {
    e.preventDefault();
    router.push(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
  };
  return (
    <header className="bg-souq-green text-white sticky top-0 z-20 shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-souq-gold text-souq-deep flex items-center justify-center text-xl font-black">
              س
            </span>
            <span className="font-black text-lg">{t("brand")}</span>
          </Link>
          <HeaderCategoryMenu />
        </div>
        <form onSubmit={submitSearch} className="hidden md:block flex-1 max-w-md">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="w-full rounded-full border-0 bg-white/95 px-4 py-2 text-souq-ink text-sm focus:outline-none focus:ring-2 focus:ring-souq-gold"
          />
        </form>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            className="text-sm border border-souq-gold/60 rounded-full px-3 py-1 hover:bg-souq-gold hover:text-souq-deep transition"
          >
            {lang === "ar" ? "FR" : "عربي"}
          </button>
          <Link href="/wishlist" aria-label={t("wishlist")} className="relative hidden md:block">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {wishCount > 0 && (
              <span className="absolute -top-1 -end-2 bg-souq-gold text-souq-deep text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {wishCount}
              </span>
            )}
          </Link>
          <Link href="/account" aria-label="account">
            <AccountIcon gender={customer?.gender} />
          </Link>
          <Link href="/cart" className="relative text-2xl" aria-label={t("cart")}>
            🛒
            {count > 0 && (
              <span className="absolute -top-1 -end-2 bg-souq-gold text-souq-deep text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
