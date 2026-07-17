"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CATEGORY_TREE } from "../lib/categories";
import { useStore } from "../lib/store";

// AliExpress-style department menu:
// - Desktop: "All categories" button opens a two-pane flyout (mains rail +
//   subcategory grid for the hovered main).
// - Mobile: full drawer with accordion sections.
export default function CategoryMenu() {
  const { lang } = useStore();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(CATEGORY_TREE[0].slug);
  const [expanded, setExpanded] = useState(null);
  const panelRef = useRef(null);

  const name = (item) => (lang === "ar" ? item.ar : item.fr);
  const activeCat = CATEGORY_TREE.find((c) => c.slug === active) || CATEGORY_TREE[0];

  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-souq-gold text-souq-deep font-bold rounded-full px-4 py-2 text-sm"
        aria-expanded={open}
      >
        ☰ {lang === "ar" ? "جميع الفئات" : "Toutes les catégories"}
      </button>

      {open && (
        <>
          {/* Desktop flyout */}
          <div className="hidden md:flex absolute start-0 top-full mt-2 z-40 bg-white text-souq-ink rounded-2xl shadow-2xl border border-souq-goldlight/60 overflow-hidden" style={{ width: "640px" }}>
            <div className="w-56 bg-souq-sand max-h-[420px] overflow-y-auto py-2">
              {CATEGORY_TREE.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/?cat=${cat.slug}`}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActive(cat.slug)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold ${
                    active === cat.slug ? "bg-white text-souq-green" : "text-souq-ink/80"
                  }`}
                >
                  <span>{cat.emoji}</span> {name(cat)}
                </Link>
              ))}
            </div>
            <div className="flex-1 p-5">
              <p className="font-black mb-3">{activeCat.emoji} {name(activeCat)}</p>
              <div className="grid grid-cols-2 gap-2">
                {activeCat.subs.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/?cat=${activeCat.slug}&sub=${sub.slug}`}
                    onClick={() => setOpen(false)}
                    className="text-sm text-souq-ink/80 hover:text-souq-green py-1.5"
                  >
                    {name(sub)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile drawer */}
          <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
            <div
              className="absolute inset-y-0 start-0 w-80 max-w-[85vw] bg-white text-souq-ink overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-souq-goldlight/40">
                <p className="font-black">{lang === "ar" ? "جميع الفئات" : "Catégories"}</p>
                <button onClick={() => setOpen(false)} className="text-2xl leading-none" aria-label="close">×</button>
              </div>
              {CATEGORY_TREE.map((cat) => (
                <div key={cat.slug} className="border-b border-souq-goldlight/30">
                  <div className="flex items-center">
                    <Link
                      href={`/?cat=${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex-1 flex items-center gap-2 px-4 py-3 text-sm font-bold"
                    >
                      <span>{cat.emoji}</span> {name(cat)}
                    </Link>
                    <button
                      onClick={() => setExpanded(expanded === cat.slug ? null : cat.slug)}
                      className="px-4 py-3 text-souq-ink/50"
                      aria-label="expand"
                    >
                      {expanded === cat.slug ? "−" : "+"}
                    </button>
                  </div>
                  {expanded === cat.slug && (
                    <div className="pb-2 ps-11">
                      {cat.subs.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/?cat=${cat.slug}&sub=${sub.slug}`}
                          onClick={() => setOpen(false)}
                          className="block py-1.5 text-sm text-souq-ink/70"
                        >
                          {name(sub)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
