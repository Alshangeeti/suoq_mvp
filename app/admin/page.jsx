"use client";
import { useEffect, useState } from "react";

const EMPTY_PRODUCT = {
  id: null, nameAr: "", nameFr: "", descAr: "", descFr: "",
  priceMru: "", originalPriceMru: "", category: "home", subcategory: "", emoji: "📦", stocked: false, url1688: ""
};
const STATUS_BADGE = {
  PAID: "bg-souq-green text-white",
  COD: "bg-souq-deep text-white",
  PENDING_VERIFICATION: "bg-souq-gold text-souq-deep",
  PENDING_PAYMENT: "bg-souq-gold/30 text-souq-deep",
  REJECTED: "bg-red-600 text-white"
};

const REASON_LABELS = {
  PAYMENT_NOT_COMPLETED: "Payment not completed",
  DUPLICATE_ORDER: "Duplicate order"
};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("orders");
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(null); // order ref being rejected
  const [rejectReason, setRejectReason] = useState("PAYMENT_NOT_COMPLETED");
  const [rejectNote, setRejectNote] = useState("");
  const [aeUrl, setAeUrl] = useState("");
  const [aePreview, setAePreview] = useState(null);
  const [aeError, setAeError] = useState("");
  const [aeBusy, setAeBusy] = useState(false);
  const [catImages, setCatImages] = useState({});
  const [catImgCategory, setCatImgCategory] = useState("");
  const [catImgSaved, setCatImgSaved] = useState("");
  const [catTree, setCatTree] = useState([]);
  const [newCat, setNewCat] = useState({ ar: "", fr: "" });
  const [newSub, setNewSub] = useState({ categorySlug: "", ar: "", fr: "" });
  const [catError, setCatError] = useState("");
  const [prodSearch, setProdSearch] = useState("");
  const [prodCatFilter, setProdCatFilter] = useState("");
  const [prodPage, setProdPage] = useState(1);
  const [inlinePrices, setInlinePrices] = useState({});
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkLog, setBulkLog] = useState([]);
  const [bulkTotal, setBulkTotal] = useState(0);
  const bulkStopRef = { current: false };

  const load = async (k = key) => {
    setError("");
    const res = await fetch("/api/orders", { headers: { "x-admin-key": k } });
    if (!res.ok) {
      setError("Wrong admin key");
      try { sessionStorage.removeItem("souq_admin_key"); } catch {}
      return;
    }
    try { sessionStorage.setItem("souq_admin_key", k); } catch {}
    setOrders(await res.json());
    const pr = await fetch("/api/products");
    if (pr.ok) setProducts(await pr.json());
    const ci = await fetch("/api/admin/category-images", { headers: { "x-admin-key": k } });
    if (ci.ok) {
      const data = await ci.json();
      setCatImages(data.images || {});
    }
    const ct = await fetch("/api/categories");
    if (ct.ok) {
      const data = await ct.json();
      setCatTree(data.tree || []);
      if (data.tree && data.tree.length > 0) {
        setCatImgCategory((prev) => prev || data.tree[0].slug);
      }
    }
  };

  const addCategory = async () => {
    setCatError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addCategory", ...newCat })
    });
    const data = await res.json();
    if (!res.ok) return setCatError(data.error || "Failed");
    setNewCat({ ar: "", fr: "" });
    load();
  };

  const addSub = async () => {
    setCatError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addSub", ...newSub })
    });
    const data = await res.json();
    if (!res.ok) return setCatError(data.error || "Failed");
    setNewSub({ categorySlug: newSub.categorySlug, ar: "", fr: "" });
    load();
  };

  const deleteCatOrSub = async (type, slug) => {
    if (!confirm(`Delete this ${type}?`)) return;
    setCatError("");
    const res = await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ type, slug })
    });
    const data = await res.json();
    if (!res.ok) return setCatError(data.error || "Failed");
    load();
  };

  const saveCatImage = async (slug, valueOverride) => {
    setCatImgSaved("");
    const imageUrl = valueOverride !== undefined ? valueOverride : catImages[slug] || "";
    const res = await fetch("/api/admin/category-images", {
      method: "POST",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ slug, imageUrl })
    });
    if (res.ok) {
      setCatImgSaved(slug);
      setTimeout(() => setCatImgSaved(""), 2000);
    }
  };

  // Reads a picked file, center-crops to a square and resizes to 256px JPEG —
  // small enough to store directly, sharp enough for the category circles.
  const uploadCatImage = (slug, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      URL.revokeObjectURL(img.src);
      setCatImages((prev) => ({ ...prev, [slug]: dataUrl }));
      saveCatImage(slug, dataUrl);
    };
    img.src = URL.createObjectURL(file);
  };

  // Restore the admin session on refresh (kept for this browser tab only).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("souq_admin_key");
      if (saved) {
        setKey(saved);
        load(saved);
      }
    } catch {}
  }, []);

  const logoutAdmin = () => {
    try { sessionStorage.removeItem("souq_admin_key"); } catch {}
    setKey("");
    setOrders(null);
    setProducts([]);
  };

  const patchOrder = async (ref, body) => {
    await fetch(`/api/orders/${ref}`, {
      method: "PATCH",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    load();
  };

  const submitReject = async (ref) => {
    await patchOrder(ref, { action: "rejectOrder", reasonCode: rejectReason, reasonNote: rejectNote });
    setRejecting(null);
    setRejectNote("");
    setRejectReason("PAYMENT_NOT_COMPLETED");
  };

  const runBulkImport = async () => {
    if (bulkRunning) {
      window.__souqBulkStop = true;
      return;
    }
    window.__souqBulkStop = false;
    setBulkRunning(true);
    setBulkLog([]);
    setBulkTotal(0);
    const pushLog = (line) => setBulkLog((prev) => [...prev.slice(-120), line]);
    let grandTotal = 0;
    try {
      const planRes = await fetch("/api/categories");
      pushLog("Starting bulk import — keep this page open.");
      const PLAN_SIZE = 31;
      for (let i = 0; i < PLAN_SIZE; i++) {
        if (window.__souqBulkStop) break;
        let addedForEntry = 0;
        let page = 1;
        let target = 999;
        while (!window.__souqBulkStop && addedForEntry < target && page <= 12) {
          const res = await fetch("/api/admin/bulk-import", {
            method: "POST",
            headers: { "x-admin-key": key, "Content-Type": "application/json" },
            body: JSON.stringify({ planIndex: i, page, need: 8 })
          });
          const data = await res.json().catch(() => ({}));
          if (data.entryCount) target = data.entryCount;
          if (data.entryTarget) target = data.entryTarget;
          if (!res.ok || data.error) {
            pushLog(`⚠ group ${i + 1}: ${data.error || res.status}${data.raw ? " | " + data.raw.slice(0, 200) : ""}`);
            break;
          }
          addedForEntry += data.added || 0;
          grandTotal += data.added || 0;
          setBulkTotal(grandTotal);
          if (data.added > 0) pushLog(`group ${i + 1} p${page}: +${data.added} (total ${grandTotal})`);
          if (data.exhausted) break;
          page = data.nextPage || page + 1;
          if (target === 999) target = 25;
        }
      }
      pushLog(window.__souqBulkStop ? `Stopped. Imported ${grandTotal} products.` : `Done. Imported ${grandTotal} products.`);
    } catch (e) {
      pushLog("Fatal: " + String(e.message || e));
    } finally {
      setBulkRunning(false);
      load();
    }
  };

  const fetchAePreview = async () => {
    setAeError("");
    setAePreview(null);
    setAeBusy(true);
    try {
      const res = await fetch("/api/admin/aliexpress", {
        method: "POST",
        headers: { "x-admin-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ url: aeUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAePreview(data);
      // Pre-fill the product form from the preview
      setForm({
        ...EMPTY_PRODUCT,
        nameFr: data.title || "",
        nameAr: "",
        descFr: data.title || "",
        descAr: "",
        priceMru: "",
        imageUrl: data.images && data.images[0] ? data.images[0] : "",
        images: data.images || [],
        aliexpressId: data.productId,
        skuAttr: data.skuAttr || "",
        variants: data.variants || [],
        costUsd: data.minPriceUsd || ""
      });
    } catch (e) {
      setAeError(String(e.message || e));
    } finally {
      setAeBusy(false);
    }
  };

  const saveProduct = async () => {
    setBusy(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "x-admin-key": key, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm(EMPTY_PRODUCT);
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  const saveInlinePrice = async (p) => {
    const newPrice = inlinePrices[p.id];
    if (!newPrice || parseInt(newPrice, 10) === p.priceMru) return;
    let images = [];
    try { images = JSON.parse(p.imagesJson || "[]"); } catch {}
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, priceMru: newPrice, images })
    });
    setInlinePrices((prev) => {
      const n = { ...prev };
      delete n[p.id];
      return n;
    });
    load();
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    load();
  };

  if (orders === null)
    return (
      <div className="py-16 max-w-sm mx-auto text-center" dir="ltr">
        <h1 className="font-black text-xl mb-4">Admin sign in</h1>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Admin key"
          className="w-full rounded-xl border border-souq-goldlight px-4 py-2.5 text-souq-ink"
        />
        {error && <p className="text-red-600 text-sm mt-2 font-bold">{error}</p>}
        <button onClick={() => load()} className="mt-3 w-full bg-souq-green text-white font-bold rounded-full py-2.5">
          Enter
        </button>
      </div>
    );

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders
    .filter((o) => o.status === "PAID" || o.status === "COD")
    .reduce((s, o) => s + o.totalMru, 0);
  const pendingVerifications = orders.filter((o) => o.status === "PENDING_VERIFICATION");

  const renderOrder = (o, verification = false) => {
    let items = [];
    try { items = JSON.parse(o.itemsJson || "[]"); } catch {}
    return (
      <div key={o.ref} className={`bg-white text-souq-ink rounded-2xl border p-4 ${verification ? "border-souq-gold" : "border-souq-goldlight/60"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono font-bold">{o.ref}</span>
          <span className="flex-1 text-sm">{o.customerName} · {o.phone} · {o.city}</span>
          <span className="text-xs font-bold text-souq-ink/50">{o.paymentMethod}</span>
          <span className="font-black text-souq-green">{o.totalMru.toLocaleString()} MRU</span>
          <span className={`text-xs font-bold rounded-full px-3 py-1 ${STATUS_BADGE[o.status] || "bg-souq-goldlight"}`}>
            {o.status}
          </span>
          {verification ? (
            <>
              <button onClick={() => patchOrder(o.ref, { action: "approvePayment" })} className="text-xs font-bold bg-souq-green text-white rounded-full px-3 py-1">
                ✓ Approve
              </button>
              <button onClick={() => patchOrder(o.ref, { action: "rejectPayment" })} className="text-xs font-bold border border-red-500 text-red-600 rounded-full px-3 py-1">
                ✗ Reject
              </button>
            </>
          ) : (
            <>
              {o.status === "PENDING_PAYMENT" && (
                <button onClick={() => patchOrder(o.ref, { action: "markPaid" })} className="text-xs font-bold border border-souq-green text-souq-green rounded-full px-3 py-1">
                  Mark paid
                </button>
              )}
              <select
                value={o.fulfillmentStatus || "RECEIVED"}
                onChange={(e) => patchOrder(o.ref, { fulfillmentStatus: e.target.value })}
                className="text-xs font-bold border-2 border-souq-green rounded-full px-2 py-1 bg-white text-souq-green"
                aria-label="fulfillment status"
              >
                <option value="RECEIVED">Received</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
              </select>
              {o.status !== "REJECTED" && o.status !== "PAID" && o.status !== "COD" && (
                <button
                  onClick={() => setRejecting(rejecting === o.ref ? null : o.ref)}
                  className="text-xs font-bold border border-red-500 text-red-600 rounded-full px-3 py-1"
                >
                  Reject
                </button>
              )}
              {o.status === "REJECTED" && (
                <button
                  onClick={() => patchOrder(o.ref, { action: "unreject" })}
                  className="text-xs font-bold border border-souq-goldlight text-souq-ink/60 rounded-full px-3 py-1"
                >
                  Undo reject
                </button>
              )}
            </>
          )}
        </div>
        {o.status === "REJECTED" && o.rejectionReason && (
          <p className="mt-2 text-sm font-bold text-red-600">
            Rejected: {REASON_LABELS[o.rejectionReason] || o.rejectionReason}
            {o.rejectionNote ? ` — ${o.rejectionNote}` : ""}
          </p>
        )}
        {rejecting === o.ref && (
          <div className="mt-3 pt-3 border-t border-red-200 flex flex-wrap items-center gap-2">
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-sm font-bold border border-souq-goldlight rounded-xl px-3 py-2 bg-white"
              aria-label="rejection reason"
            >
              <option value="PAYMENT_NOT_COMPLETED">Payment not completed</option>
              <option value="DUPLICATE_ORDER">Duplicate order</option>
            </select>
            <input
              type="text"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Optional note shown to the customer"
              className="flex-1 min-w-[200px] text-sm border border-souq-goldlight rounded-xl px-3 py-2"
            />
            <button onClick={() => submitReject(o.ref)} className="text-sm font-bold bg-red-600 text-white rounded-full px-4 py-2">
              Confirm reject
            </button>
            <button onClick={() => setRejecting(null)} className="text-sm font-bold text-souq-ink/60 px-2">
              Cancel
            </button>
          </div>
        )}
        {o.paymentRef && (
          <p className="mt-2 text-sm font-bold text-souq-deep">Payment ref: <span className="font-mono">{o.paymentRef}</span></p>
        )}
        {o.aeOrderId && (
          <p className="mt-2 text-sm font-bold text-souq-green">
            🛒 AliExpress order: <span className="font-mono">{o.aeOrderId}</span>
            {o.aeOrderError && o.aeOrderError.startsWith("OK") ? ` ${o.aeOrderError.slice(2)}` : ""}
            <span className="text-souq-ink/50 font-normal"> — pay it in your AliExpress account</span>
          </p>
        )}
        {!o.aeOrderId && o.aeOrderError && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-red-600 flex-1 min-w-[200px]">⚠ AE purchase failed: {o.aeOrderError.slice(0, 180)}</p>
            <button
              onClick={() => patchOrder(o.ref, { action: "retryAe" })}
              className="text-xs font-bold border border-souq-green text-souq-green rounded-full px-3 py-1"
            >
              ↻ Retry AE order
            </button>
          </div>
        )}
        {items.length > 0 && (
          <div className="mt-3 pt-3 border-t border-souq-goldlight/40 text-sm space-y-1">
            {items.map((it, idx) => {
              const prod = products.find((pp) => pp.id === it.id);
              return (
                <div key={idx} className="flex items-center justify-between gap-2 text-souq-ink/80">
                  <span className="flex-1">
                    {it.emoji} {it.nameFr || it.nameAr}{it.variantLabel ? ` (${it.variantLabel})` : ""} × {it.qty}
                  </span>
                  {prod && (prod.url1688 || prod.aliexpressId) && (o.status === "PAID" || o.status === "COD") && (
                    <a
                      href={prod.url1688 || `https://www.aliexpress.com/item/${prod.aliexpressId}.html`}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-[10px] font-bold border rounded-full px-2 py-0.5 shrink-0 ${
                        prod.url1688
                          ? "bg-orange-100 border-orange-400 text-orange-700"
                          : "bg-souq-gold/20 border-souq-gold text-souq-deep"
                      }`}
                    >
                      {prod.url1688 ? "1688 ↗" : "AE ↗"}
                    </a>
                  )}
                  <span className="shrink-0">{(it.priceMru * it.qty).toLocaleString()} MRU</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-8" dir="ltr">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-black text-xl">Dashboard</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => load()} className="text-sm font-bold text-souq-gold">↻ Refresh</button>
          <button onClick={logoutAdmin} className="text-sm font-bold text-red-400">Log out</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white text-souq-ink rounded-2xl border border-souq-goldlight/60 p-4 text-center">
          <p className="text-2xl font-black text-souq-green">{todayOrders.length}</p>
          <p className="text-xs font-bold text-souq-ink/60">Orders today</p>
        </div>
        <div className="bg-white text-souq-ink rounded-2xl border border-souq-goldlight/60 p-4 text-center">
          <p className="text-2xl font-black text-souq-green">{todayRevenue.toLocaleString()}</p>
          <p className="text-xs font-bold text-souq-ink/60">Revenue today (MRU)</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${pendingVerifications.length ? "bg-souq-gold/20 border-souq-gold text-white" : "bg-white text-souq-ink border-souq-goldlight/60"}`}>
          <p className="text-2xl font-black text-souq-deep">{pendingVerifications.length}</p>
          <p className="text-xs font-bold text-souq-ink/60">Pending verification</p>
        </div>
      </div>

      {pendingVerifications.length > 0 && (
        <section className="mb-6">
          <h2 className="font-black mb-3">⚠ Payment verification queue</h2>
          <div className="space-y-3">{pendingVerifications.map((o) => renderOrder(o, true))}</div>
        </section>
      )}

      <div className="flex gap-1 mb-5 bg-white text-souq-ink rounded-full border border-souq-goldlight/60 p-1 w-fit">
        {["orders", "products", "sourcing"].map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-sm font-bold rounded-full py-2 px-5 capitalize ${tab === k ? "bg-souq-green text-white" : "text-souq-ink/70"}`}
          >
            {k} ({k === "orders" ? orders.length : k === "products" ? products.length : orders.filter((o) => (o.status === "PAID" || o.status === "COD") && ["RECEIVED", "IN_PROGRESS"].includes(o.fulfillmentStatus || "RECEIVED")).length})
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.map((o) => renderOrder(o))}
          {orders.length === 0 && <p className="text-center text-souq-ink/50 py-10">No orders yet</p>}
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-6">
          <div className="bg-white text-souq-ink rounded-2xl border-2 border-souq-green/60 p-4">
            <h2 className="font-black mb-1">📦 Bulk import — Mauritania plan (~500 products)</h2>
            <p className="text-xs text-souq-ink/60 mb-3">
              Imports popular, low-cost AliExpress products across 31 Mauritania-focused groups (phone accessories,
              solar lamps, tea sets, abayas, fans, tools...). China-stocked variants preferred, prices set at cost × 1.2.
              Runs in batches — keep this page open; you can stop anytime.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={runBulkImport}
                className={`font-bold rounded-full px-6 py-2 ${bulkRunning ? "bg-red-600 text-white" : "bg-souq-green text-white"}`}
              >
                {bulkRunning ? "■ Stop" : "▶ Start bulk import"}
              </button>
              {bulkTotal > 0 && <span className="font-black text-souq-green">{bulkTotal} imported</span>}
            </div>
            {bulkLog.length > 0 && (
              <pre className="mt-3 bg-souq-sand rounded-xl p-3 text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap" dir="ltr">
                {bulkLog.join("\n")}
              </pre>
            )}
          </div>

          <div className="bg-white text-souq-ink rounded-2xl border-2 border-souq-gold/60 p-4">
            <h2 className="font-black mb-1">🔗 Import from AliExpress</h2>
            <p className="text-xs text-souq-ink/60 mb-3">
              Paste a product link — title, photos and cost auto-fill below. Set your MRU price and Arabic name, then add.
              {" "}<a href="/callback" className="underline font-bold">Connection status</a>
            </p>
            <div className="flex gap-2">
              <input
                value={aeUrl}
                onChange={(e) => setAeUrl(e.target.value)}
                placeholder="https://www.aliexpress.com/item/100500...html"
                className="flex-1 rounded-xl border border-souq-goldlight px-3 py-2 text-sm"
                dir="ltr"
              />
              <button
                disabled={aeBusy || !aeUrl.trim()}
                onClick={fetchAePreview}
                className="bg-souq-gold text-souq-deep font-bold rounded-xl px-5 py-2 disabled:opacity-50"
              >
                {aeBusy ? "..." : "Fetch"}
              </button>
            </div>
            {aeError && <p className="text-red-600 text-sm font-bold mt-2 whitespace-pre-wrap">{aeError}</p>}
            {aePreview && (
              <div className="mt-3 flex flex-wrap items-center gap-3 bg-souq-sand rounded-xl p-3">
                {aePreview.images && aePreview.images[0] && (
                  <img src={aePreview.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-[150px]">
                  <p className="text-sm font-bold leading-snug">{aePreview.title}</p>
                  <p className="text-xs text-souq-ink/60 mt-0.5">
                    Cost: {aePreview.minPriceUsd != null ? `$${aePreview.minPriceUsd}` : "?"}
                    {aePreview.maxPriceUsd != null && aePreview.maxPriceUsd !== aePreview.minPriceUsd ? ` – $${aePreview.maxPriceUsd}` : ""}
                    {" · "}{aePreview.images ? aePreview.images.length : 0} photos · ID {aePreview.productId}
                  </p>
                  <p className="text-xs text-souq-green font-bold mt-1">✓ Form below pre-filled — set price &amp; Arabic name, then Add product</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white text-souq-ink rounded-2xl border border-souq-goldlight/60 p-4">
            <h2 className="font-black mb-3">{form.id ? `Edit product #${form.id}` : "Add product"}</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="Name (Arabic)" dir="rtl" className="rounded-xl border border-souq-goldlight px-3 py-2" />
              <input value={form.nameFr} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} placeholder="Name (French)" className="rounded-xl border border-souq-goldlight px-3 py-2" />
              <input value={form.descAr} onChange={(e) => setForm({ ...form, descAr: e.target.value })} placeholder="Description (Arabic)" dir="rtl" className="rounded-xl border border-souq-goldlight px-3 py-2" />
              <input value={form.descFr} onChange={(e) => setForm({ ...form, descFr: e.target.value })} placeholder="Description (French)" className="rounded-xl border border-souq-goldlight px-3 py-2" />
              <input value={form.priceMru} onChange={(e) => setForm({ ...form, priceMru: e.target.value })} placeholder="Price (MRU)" type="number" className="rounded-xl border border-souq-goldlight px-3 py-2" />
              <input value={form.originalPriceMru || ""} onChange={(e) => setForm({ ...form, originalPriceMru: e.target.value })} placeholder="Original price before discount (optional)" type="number" className="rounded-xl border border-souq-goldlight px-3 py-2" />
              <input value={form.url1688 || ""} onChange={(e) => setForm({ ...form, url1688: e.target.value })} placeholder="1688 link for sourcing (optional)" dir="ltr" className="rounded-xl border border-souq-goldlight px-3 py-2 md:col-span-2" />
              <div className="flex gap-2">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: "" })}
                  className="flex-1 rounded-xl border border-souq-goldlight px-3 py-2 bg-white"
                  aria-label="category"
                >
                  {catTree.map((c2) => (
                    <option key={c2.slug} value={c2.slug}>{c2.fr} / {c2.ar}</option>
                  ))}
                </select>
                <select
                  value={form.subcategory || ""}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  className="flex-1 rounded-xl border border-souq-goldlight px-3 py-2 bg-white"
                  aria-label="subcategory"
                >
                  <option value="">— subcategory —</option>
                  {(catTree.find((c2) => c2.slug === form.category)?.subs || []).map((s2) => (
                    <option key={s2.slug} value={s2.slug}>{s2.fr} / {s2.ar}</option>
                  ))}
                </select>
                <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="Emoji" className="w-20 rounded-xl border border-souq-goldlight px-3 py-2 text-center" />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm font-bold">
              <input type="checkbox" checked={form.stocked} onChange={(e) => setForm({ ...form, stocked: e.target.checked })} />
              In stock in Guangzhou warehouse (3-5 day delivery)
            </label>
            <div className="flex gap-2 mt-4">
              <button disabled={busy} onClick={saveProduct} className="bg-souq-green text-white font-bold rounded-full px-6 py-2 disabled:opacity-50">
                {form.id ? "Save changes" : "Add product"}
              </button>
              {form.id && (
                <button onClick={() => setForm(EMPTY_PRODUCT)} className="text-sm font-bold text-souq-ink/60 px-3">
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="bg-white text-souq-ink rounded-2xl border border-souq-goldlight/60 p-4">
            <h2 className="font-black mb-1">Categories &amp; subcategories</h2>
            <p className="text-xs text-souq-ink/60 mb-3">
              Add or delete departments and their subcategories. A category with products can't be deleted until its products are moved.
            </p>
            {catError && <p className="text-red-600 text-sm font-bold mb-2">{catError}</p>}

            <div className="flex flex-wrap gap-2 mb-4">
              <input value={newCat.ar} onChange={(e) => setNewCat({ ...newCat, ar: e.target.value })} placeholder="اسم الفئة (عربي)" dir="rtl" className="flex-1 min-w-[140px] rounded-xl border border-souq-goldlight px-3 py-2 text-sm" />
              <input value={newCat.fr} onChange={(e) => setNewCat({ ...newCat, fr: e.target.value })} placeholder="Nom (français)" className="flex-1 min-w-[140px] rounded-xl border border-souq-goldlight px-3 py-2 text-sm" />
              <button onClick={addCategory} disabled={!newCat.ar || !newCat.fr} className="text-sm font-bold bg-souq-green text-white rounded-full px-5 py-2 disabled:opacity-50">
                + Category
              </button>
            </div>

            <div className="space-y-3">
              {catTree.map((c2) => (
                <div key={c2.slug} className="border border-souq-goldlight/50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-bold text-sm">{c2.fr} / {c2.ar}</span>
                    <button onClick={() => deleteCatOrSub("category", c2.slug)} className="text-xs font-bold border border-red-500 text-red-600 rounded-full px-3 py-1">
                      Delete
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c2.subs.map((s2) => (
                      <span key={s2.slug} className="inline-flex items-center gap-1 text-xs bg-souq-sand rounded-full ps-3 pe-1 py-1">
                        {s2.fr} / {s2.ar}
                        <button onClick={() => deleteCatOrSub("sub", s2.slug)} aria-label="delete subcategory" className="w-4 h-4 rounded-full bg-red-100 text-red-600 font-bold leading-none">×</button>
                      </span>
                    ))}
                    {c2.subs.length === 0 && <span className="text-xs text-souq-ink/40">no subcategories</span>}
                  </div>
                  {newSub.categorySlug === c2.slug ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <input value={newSub.ar} onChange={(e) => setNewSub({ ...newSub, ar: e.target.value })} placeholder="اسم فرعي (عربي)" dir="rtl" className="flex-1 min-w-[120px] rounded-xl border border-souq-goldlight px-3 py-1.5 text-sm" />
                      <input value={newSub.fr} onChange={(e) => setNewSub({ ...newSub, fr: e.target.value })} placeholder="Nom (français)" className="flex-1 min-w-[120px] rounded-xl border border-souq-goldlight px-3 py-1.5 text-sm" />
                      <button onClick={addSub} disabled={!newSub.ar || !newSub.fr} className="text-xs font-bold bg-souq-green text-white rounded-full px-4 py-1.5 disabled:opacity-50">
                        Add
                      </button>
                      <button onClick={() => setNewSub({ categorySlug: "", ar: "", fr: "" })} className="text-xs font-bold text-souq-ink/50 px-2">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setNewSub({ categorySlug: c2.slug, ar: "", fr: "" })} className="mt-2 text-xs font-bold text-souq-green">
                      + subcategory
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white text-souq-ink rounded-2xl border border-souq-goldlight/60 p-4">
            <h2 className="font-black mb-1">Subcategory photos</h2>
            <p className="text-xs text-souq-ink/60 mb-3">
              These photos appear as circles on each category page. Paste an image URL (e.g. a product photo link) and Save.
            </p>
            <select
              value={catImgCategory}
              onChange={(e) => setCatImgCategory(e.target.value)}
              className="rounded-xl border border-souq-goldlight px-3 py-2 bg-white mb-3"
              aria-label="category for photos"
            >
              {catTree.map((c2) => (
                <option key={c2.slug} value={c2.slug}>{c2.fr} / {c2.ar}</option>
              ))}
            </select>
            <div className="space-y-2">
              {(catTree.find((c2) => c2.slug === catImgCategory)?.subs || []).map((s2) => (
                <div key={s2.slug} className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-full overflow-hidden border border-souq-goldlight/60 bg-souq-sand flex items-center justify-center shrink-0">
                    {catImages[s2.slug] ? (
                      <img src={catImages[s2.slug]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-souq-green">{s2.fr.slice(0, 1)}</span>
                    )}
                  </span>
                  <span className="w-40 text-sm font-bold shrink-0">{s2.fr} / {s2.ar}</span>
                  <input
                    value={(catImages[s2.slug] || "").startsWith("data:") ? "(uploaded picture)" : (catImages[s2.slug] || "")}
                    onChange={(e) => setCatImages({ ...catImages, [s2.slug]: e.target.value })}
                    placeholder="https://...jpg"
                    dir="ltr"
                    className="flex-1 rounded-xl border border-souq-goldlight px-3 py-1.5 text-sm"
                  />
                  <label className="text-xs font-bold border border-souq-green text-souq-green rounded-full px-3 py-1.5 cursor-pointer whitespace-nowrap">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        uploadCatImage(s2.slug, e.target.files && e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    onClick={() => saveCatImage(s2.slug)}
                    className="text-xs font-bold bg-souq-green text-white rounded-full px-4 py-1.5"
                  >
                    {catImgSaved === s2.slug ? "✓" : "Save"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {(() => {
            const PER_PAGE = 20;
            const qq = prodSearch.trim().toLowerCase();
            const filtered = products.filter((p) => {
              if (prodCatFilter && p.category !== prodCatFilter) return false;
              if (!qq) return true;
              return [p.nameAr, p.nameFr, p.aliexpressId].filter(Boolean).some((s) => String(s).toLowerCase().includes(qq));
            });
            const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
            const cur = Math.min(prodPage, pages);
            const shown = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
            return (
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    value={prodSearch}
                    onChange={(e) => { setProdSearch(e.target.value); setProdPage(1); }}
                    placeholder="Search products..."
                    className="flex-1 min-w-[180px] rounded-xl border border-souq-goldlight px-3 py-2 text-sm"
                  />
                  <select
                    value={prodCatFilter}
                    onChange={(e) => { setProdCatFilter(e.target.value); setProdPage(1); }}
                    className="rounded-xl border border-souq-goldlight px-3 py-2 bg-white text-sm font-bold"
                    aria-label="filter category"
                  >
                    <option value="">All categories</option>
                    {catTree.map((c2) => (
                      <option key={c2.slug} value={c2.slug}>{c2.fr}</option>
                    ))}
                  </select>
                  <span className="text-sm font-bold text-white/70 self-center">{filtered.length} products</span>
                </div>
                <div className="space-y-2">
                  {shown.map((p) => (
                    <div key={p.id} className="bg-white text-souq-ink rounded-2xl border border-souq-goldlight/60 p-3 flex items-center gap-3 flex-wrap">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <span className="text-3xl">{p.emoji}</span>
                      )}
                      <div className="flex-1 min-w-[160px]">
                        <p className="font-bold text-sm">{p.nameFr} · {p.nameAr}</p>
                        <p className="text-xs text-souq-ink/50">
                          {p.category}{p.subcategory ? ` / ${p.subcategory}` : ""} · {p.stocked ? "stocked" : "on-demand"}
                          {p.costUsd ? ` · cost $${p.costUsd}` : ""}
                        </p>
                      </div>
                      {p.url1688 && (
                        <a
                          href={p.url1688}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold bg-orange-100 border border-orange-400 text-orange-700 rounded-full px-3 py-1"
                        >
                          1688 ↗
                        </a>
                      )}
                      {p.aliexpressId ? (
                        <a
                          href={`https://www.aliexpress.com/item/${p.aliexpressId}.html`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold bg-souq-gold/20 border border-souq-gold text-souq-deep rounded-full px-3 py-1"
                        >
                          AE ↗
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-souq-ink/30 border border-souq-goldlight/50 rounded-full px-2 py-1">
                          no AE link
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={inlinePrices[p.id] !== undefined ? inlinePrices[p.id] : p.priceMru}
                          onChange={(e) => setInlinePrices({ ...inlinePrices, [p.id]: e.target.value })}
                          className="w-24 rounded-lg border border-souq-goldlight px-2 py-1 text-sm font-bold text-souq-green"
                          aria-label="price"
                        />
                        <span className="text-xs font-bold text-souq-ink/50">MRU</span>
                        {inlinePrices[p.id] !== undefined && String(inlinePrices[p.id]) !== String(p.priceMru) && (
                          <button onClick={() => saveInlinePrice(p)} className="text-xs font-bold bg-souq-green text-white rounded-full px-3 py-1">
                            ✓
                          </button>
                        )}
                      </div>
                      <button onClick={() => setForm({ ...p, priceMru: String(p.priceMru), originalPriceMru: p.originalPriceMru ? String(p.originalPriceMru) : "" })} className="text-xs font-bold border border-souq-green text-souq-green rounded-full px-3 py-1">
                        Edit
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="text-xs font-bold border border-red-500 text-red-600 rounded-full px-3 py-1">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button disabled={cur <= 1} onClick={() => setProdPage(cur - 1)} className="text-sm font-bold bg-white text-souq-ink rounded-full px-4 py-1.5 disabled:opacity-40">←</button>
                    <span className="text-sm font-bold text-white/80">{cur} / {pages}</span>
                    <button disabled={cur >= pages} onClick={() => setProdPage(cur + 1)} className="text-sm font-bold bg-white text-souq-ink rounded-full px-4 py-1.5 disabled:opacity-40">→</button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {tab === "sourcing" && (() => {
        const toSource = orders.filter(
          (o) => (o.status === "PAID" || o.status === "COD") && ["RECEIVED", "IN_PROGRESS"].includes(o.fulfillmentStatus || "RECEIVED")
        );
        const rows = [];
        for (const o of toSource) {
          let items = [];
          try { items = JSON.parse(o.itemsJson || "[]"); } catch {}
          for (const it of items) {
            const prod = products.find((pp) => pp.id === it.id);
            rows.push({
              ref: o.ref,
              name: it.nameFr || it.nameAr,
              variant: it.variantLabel || "",
              qty: it.qty,
              costUsd: prod && prod.costUsd ? prod.costUsd : "",
              link1688: prod && prod.url1688 ? prod.url1688 : "",
              linkAe: prod && prod.aliexpressId ? `https://www.aliexpress.com/item/${prod.aliexpressId}.html` : "",
              stocked: prod ? (prod.stocked ? "warehouse-stock" : "to-buy") : "unknown"
            });
          }
        }
        const downloadCsv = () => {
          const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
          const head = ["order_ref", "product", "variant", "qty", "cost_usd", "link_1688", "link_aliexpress", "type"];
          const lines = [head.join(",")].concat(
            rows.map((r) => [r.ref, r.name, r.variant, r.qty, r.costUsd, r.link1688, r.linkAe, r.stocked].map(esc).join(","))
          );
          const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `sourcing-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(a.href);
        };
        return (
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm font-bold text-white/80">
                {rows.length} item(s) from {toSource.length} confirmed order(s) awaiting purchase
              </p>
              <button
                onClick={downloadCsv}
                disabled={rows.length === 0}
                className="text-sm font-bold bg-souq-gold text-souq-deep rounded-full px-5 py-2 disabled:opacity-40"
              >
                ⬇ Export CSV (for ERP / team)
              </button>
            </div>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="bg-white text-souq-ink rounded-2xl border border-souq-goldlight/60 p-3 flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-souq-ink/50">{r.ref}</span>
                  <span className="flex-1 min-w-[180px] text-sm font-bold">
                    {r.name}{r.variant ? ` (${r.variant})` : ""}
                  </span>
                  <span className="text-sm font-black">× {r.qty}</span>
                  {r.costUsd && <span className="text-xs text-souq-ink/50">${r.costUsd}</span>}
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${r.stocked === "warehouse-stock" ? "bg-souq-green/10 text-souq-green" : "bg-orange-100 text-orange-700"}`}>
                    {r.stocked}
                  </span>
                  {r.link1688 && (
                    <a href={r.link1688} target="_blank" rel="noreferrer" className="text-xs font-bold bg-orange-100 border border-orange-400 text-orange-700 rounded-full px-3 py-1">
                      1688 ↗
                    </a>
                  )}
                  {r.linkAe && (
                    <a href={r.linkAe} target="_blank" rel="noreferrer" className="text-xs font-bold bg-souq-gold/20 border border-souq-gold text-souq-deep rounded-full px-3 py-1">
                      AE ↗
                    </a>
                  )}
                </div>
              ))}
              {rows.length === 0 && <p className="text-center text-white/50 py-10">Nothing awaiting purchase 🎉</p>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
