"use client";
import Link from "next/link";
import { useStore } from "../lib/store";

export default function Header() {
  const { t, lang, setLang, count } = useStore();
  return (
    <header className="bg-souq-green text-white sticky top-0 z-20 shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-full bg-souq-gold text-souq-deep flex items-center justify-center text-xl font-black">
            س
          </span>
          <span className="font-black text-lg">{t("brand")}</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            className="text-sm border border-souq-gold/60 rounded-full px-3 py-1 hover:bg-souq-gold hover:text-souq-deep transition"
          >
            {lang === "ar" ? "FR" : "عربي"}
          </button>
          <Link href="/account" className="text-2xl" aria-label="account">
            👤
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
