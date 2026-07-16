"use client";
import { useState } from "react";

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  const load = async (k = key) => {
    setError("");
    const res = await fetch("/api/orders", { headers: { "x-admin-key": k } });
    if (!res.ok) {
      setError("Wrong admin key");
      return;
    }
    setOrders(await res.json());
  };

  const markPaid = async (ref) => {
    await fetch(`/api/orders/${ref}`, { method: "PATCH", headers: { "x-admin-key": key } });
    load();
  };

  if (orders === null)
    return (
      <div className="py-16 max-w-sm mx-auto text-center" dir="ltr">
        <h1 className="font-black text-xl mb-4">Admin</h1>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          className="w-full rounded-xl border border-souq-goldlight px-4 py-2.5"
        />
        {error && <p className="text-red-600 text-sm mt-2 font-bold">{error}</p>}
        <button onClick={() => load()} className="mt-3 w-full bg-souq-green text-white font-bold rounded-full py-2.5">
          Enter
        </button>
      </div>
    );

  return (
    <div className="py-8" dir="ltr">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-black text-xl">Orders ({orders.length})</h1>
        <button onClick={() => load()} className="text-sm font-bold text-souq-green">↻ Refresh</button>
      </div>
      <div className="space-y-3">
        {orders.map((o) => {
          let items = [];
          try {
            items = JSON.parse(o.itemsJson || "[]");
          } catch {}
          return (
            <div key={o.ref} className="bg-white rounded-2xl border border-souq-goldlight/60 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold">{o.ref}</span>
                <span className="flex-1 text-sm">{o.customerName} · {o.phone} · {o.city}</span>
                <span className="font-black text-souq-green">{o.totalMru.toLocaleString()} MRU</span>
                <span
                  className={`text-xs font-bold rounded-full px-3 py-1 ${
                    o.status === "PAID" ? "bg-souq-green text-white" : "bg-souq-gold/30 text-souq-deep"
                  }`}
                >
                  {o.status}
                </span>
                {o.status !== "PAID" && (
                  <button onClick={() => markPaid(o.ref)} className="text-xs font-bold border border-souq-green text-souq-green rounded-full px-3 py-1">
                    Mark paid
                  </button>
                )}
              </div>
              {items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-souq-goldlight/40 text-sm space-y-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-souq-ink/80">
                      <span>{it.emoji} {it.nameFr || it.nameAr} × {it.qty}</span>
                      <span>{(it.priceMru * it.qty).toLocaleString()} MRU</span>
                    </div>
                  ))}
                </div>
              )}
              {items.length === 0 && (
                <p className="mt-3 pt-3 border-t border-souq-goldlight/40 text-xs text-souq-ink/40">Address: {o.address}</p>
              )}
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-center text-souq-ink/50 py-10">No orders yet</p>}
      </div>
    </div>
  );
}
