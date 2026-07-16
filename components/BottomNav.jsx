"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "../lib/store";
import AccountIcon from "./AccountIcon";

export default function BottomNav() {
  const { t, count, customer } = useStore();
  const pathname = usePathname();

  const item = (href, label, content) => (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 text-[11px] font-bold flex-1 py-1.5 ${
        pathname === href ? "text-souq-green" : "text-souq-ink/50"
      }`}
    >
      {content}
      <span>{label}</span>
    </Link>
  );

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-souq-goldlight/60 flex z-40" aria-label="bottom navigation">
      {item("/", t("homeCrumb"), <span className="text-xl leading-none">🏠</span>)}
      {item(
        "/cart",
        t("cart"),
        <span className="relative text-xl leading-none">
          🛒
          {count > 0 && (
            <span className="absolute -top-1.5 -end-2.5 bg-souq-gold text-souq-deep text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {count}
            </span>
          )}
        </span>
      )}
      {item("/account", t("account"), <AccountIcon gender={customer?.gender} size={22} />)}
    </nav>
  );
}
