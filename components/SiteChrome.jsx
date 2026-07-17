"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import BottomNav from "./BottomNav";

// Splits the app into two completely separate shells:
// - /admin/*  → bare admin chrome (no store header, cart, account or nav)
// - all else  → the customer storefront chrome
export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#10141f] text-white" dir="ltr">
        <header className="bg-[#0a0d15] border-b border-white/10 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-souq-gold text-souq-deep flex items-center justify-center font-black">
              ⚙
            </span>
            <span className="font-black">Souq Mauritania — Admin</span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 pb-20">{children}</main>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 pb-24 md:pb-20">{children}</main>
      <footer className="bg-souq-deep text-souq-goldlight text-center py-6 text-sm">
        Souq Mauritania © {new Date().getFullYear()} — Guangzhou ⇄ Nouakchott
      </footer>
      <BottomNav />
    </>
  );
}
