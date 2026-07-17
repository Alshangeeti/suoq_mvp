"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useStore } from "../lib/store";

// Hamburger beside the logo. Hover (desktop) or tap opens a dropdown of main
// categories; clicking one navigates to its dedicated /category page.
export default function HeaderCategoryMenu() {
  const { lang } = useStore();
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState([]);
  const wrapRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setTree(d.tree || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const enter = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <div
      className="relative"
      ref={wrapRef}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={lang === "ar" ? "الفئات" : "Catégories"}
        className="p-2 rounded-lg hover:bg-white/10 transition"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="absolute start-0 top-full mt-1 z-50 w-64 max-h-[70vh] overflow-y-auto bg-white text-souq-ink rounded-2xl shadow-2xl border border-souq-goldlight/60 py-2">
          {tree.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              onClick={() => setOpen(false)}
              className="block px-5 py-2.5 text-sm font-bold text-souq-ink/85 hover:bg-souq-sand hover:text-souq-green"
            >
              {lang === "ar" ? cat.ar : cat.fr}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
