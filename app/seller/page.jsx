"use client";
import { useEffect, useState } from "react";
import { openShippingSlip } from "../../lib/slip";

const EMPTY = { id: null, nameAr: "", nameFr: "", descAr: "", descFr: "", priceMru: "", stockQty: "", category: "", subcategory: "", imageUrl: "" };

export default function SellerPortal() {
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [tree, setTree] = useState([]);
  const [pForm, setPForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);

  const loadMe = async () => {
    const res = await fetch("/api/seller/auth");
    const data = await res.json();
    setSeller(data.seller);
    setLoading(false);
    if (data.seller && data.seller.status === "APPROVED") {
      loadPortal();
    }
  };

  const loadPortal = async () => {
    const [s, p, t] = await Promise.all([
      fetch("/api/seller/stats").then((r) => r.json()).catch(() => null),
      fetch("/api/seller/products").then((r) => r.json()).catch(() => null),
      fetch("/api/categories").then((r) => r.json()).catch(() => null)
    ]);
    if (s && s.stats) {
      setStats(s.stats);
      setSales(s.sales || []);
    }
    if (p && p.products) setProducts(p.products);
    if (t && t.tree) setTree(t.tree);
  };

  useEffect(() => {
    loadMe();
  }, []);

  const submitAuth = async (action) => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/seller/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      await loadMe();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/seller/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" })
    });
    setSeller(null);
  };

  const uploadImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    img.onload = () => {
      const max = 500;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      URL.revokeObjectURL(img.src);
      setPForm((f) => ({ ...f, imageUrl: dataUrl }));
    };
    img.src = URL.createObjectURL(file);
  };

  const saveProduct = async () => {
    setError("");
    setBusy(true);
    setSaved(false);
    try {
      const res = await fetch("/api/seller/products", {
        method: pForm.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      setPForm(EMPTY);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      loadPortal();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("حذف هذا المنتج؟")) return;
    await fetch("/api/seller/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    loadPortal();
  };

  const input = (key, placeholder, type = "text", dir) => (
    <input
      type={type}
      dir={dir}
      value={form[key] || ""}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      placeholder={placeholder}
      className="w-full rounded-xl border border-souq-goldlight px-4 py-2.5 text-sm"
    />
  );

  if (loading) return <div className="py-20 text-center font-bold text-white/60">...</div>;

  // ---------- Not logged in ----------
  if (!seller) {
    return (
      <div className="py-10 max-w-md mx-auto" dir="rtl">
        <h1 className="font-black text-2xl mb-1">بوابة التجار</h1>
        <p className="text-white/60 text-sm mb-5">اعرض منتجاتك على سوق موريتانيا وتابع مبيعاتك</p>

        <div className="flex gap-1 bg-white/10 rounded-full p-1 mb-5">
          <button onClick={() => setMode("login")} className={`flex-1 text-sm font-bold rounded-full py-2 ${mode === "login" ? "bg-souq-gold text-souq-deep" : "text-white/70"}`}>
            تسجيل الدخول
          </button>
          <button onClick={() => setMode("signup")} className={`flex-1 text-sm font-bold rounded-full py-2 ${mode === "signup" ? "bg-souq-gold text-souq-deep" : "text-white/70"}`}>
            حساب جديد
          </button>
        </div>

        <div className="bg-white text-souq-ink rounded-2xl p-5 space-y-3">
          {mode === "signup" && (
            <>
              {input("businessName", "اسم النشاط التجاري *")}
              {input("ownerName", "اسم صاحب النشاط *")}
              {input("phone", "رقم الهاتف *", "tel", "ltr")}
              {input("city", "المدينة")}
              <textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="وصف نشاطك: ماذا تبيع؟ منذ متى؟ (يساعدنا في الموافقة)"
                rows={3}
                className="w-full rounded-xl border border-souq-goldlight px-4 py-2.5 text-sm"
              />
              {input("licenseInfo", "رقم السجل التجاري (اختياري)")}
            </>
          )}
          {input("email", "البريد الإلكتروني *", "email", "ltr")}
          {input("password", "كلمة المرور *", "password", "ltr")}
          {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
          <button
            disabled={busy}
            onClick={() => submitAuth(mode)}
            className="w-full bg-souq-green text-white font-bold rounded-full py-2.5 disabled:opacity-50"
          >
            {busy ? "..." : mode === "signup" ? "إرسال طلب التسجيل" : "دخول"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Pending / Rejected ----------
  if (seller.status === "PENDING") {
    return (
      <div className="py-20 max-w-md mx-auto text-center" dir="rtl">
        <p className="text-5xl mb-4">🕐</p>
        <h1 className="font-black text-xl mb-2">طلبك قيد المراجعة</h1>
        <p className="text-white/70 text-sm">
          استلمنا طلب تسجيل «{seller.businessName}». سيراجعه فريقنا ويتم إشعارك عند الموافقة.
        </p>
        <button onClick={logout} className="mt-6 text-sm font-bold text-souq-gold">تسجيل الخروج</button>
      </div>
    );
  }
  if (seller.status === "REJECTED") {
    return (
      <div className="py-20 max-w-md mx-auto text-center" dir="rtl">
        <p className="text-5xl mb-4">❌</p>
        <h1 className="font-black text-xl mb-2">لم تتم الموافقة على الطلب</h1>
        {seller.rejectionNote && <p className="text-white/70 text-sm">السبب: {seller.rejectionNote}</p>}
        <p className="text-white/50 text-xs mt-2">للاستفسار تواصل مع إدارة سوق موريتانيا</p>
        <button onClick={logout} className="mt-6 text-sm font-bold text-souq-gold">تسجيل الخروج</button>
      </div>
    );
  }

  // ---------- Approved dashboard ----------
  const activeSubs = (tree.find((c) => c.slug === pForm.category)?.subs) || [];
  return (
    <div className="py-6" dir="rtl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="font-black text-xl">{seller.businessName}</h1>
          <p className="text-white/50 text-xs">{seller.ownerName} · {seller.email}</p>
        </div>
        <button onClick={logout} className="text-sm font-bold text-red-400">تسجيل الخروج</button>
      </div>

      <div className="flex gap-1 mb-5 bg-white/10 rounded-full p-1 w-fit">
        {[["stats", "الإحصائيات"], ["products", `منتجاتي (${products.length})`], ["sales", "المبيعات"]].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-sm font-bold rounded-full py-2 px-5 ${tab === k ? "bg-souq-gold text-souq-deep" : "text-white/70"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stats" && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            [stats.productCount, "منتج معروض"],
            [stats.totalStock, "قطعة في المخزون"],
            [stats.soldQty, "قطعة مباعة"],
            [stats.revenue.toLocaleString(), "أوقية مبيعات"],
            [stats.pendingQty, "قيد التوصيل"]
          ].map(([v, label], i) => (
            <div key={i} className="bg-white text-souq-ink rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-souq-green">{v}</p>
              <p className="text-xs font-bold text-souq-ink/60 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-4">
          <div className="bg-white text-souq-ink rounded-2xl p-4">
            <h2 className="font-black mb-3">{pForm.id ? `تعديل المنتج #${pForm.id}` : "إضافة منتج جديد"}</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <input value={pForm.nameAr} onChange={(e) => setPForm({ ...pForm, nameAr: e.target.value })} placeholder="اسم المنتج (عربي) *" className="rounded-xl border border-souq-goldlight px-3 py-2 text-sm" />
              <input value={pForm.nameFr} onChange={(e) => setPForm({ ...pForm, nameFr: e.target.value })} placeholder="Nom du produit (français) *" dir="ltr" className="rounded-xl border border-souq-goldlight px-3 py-2 text-sm" />
              <input value={pForm.descAr} onChange={(e) => setPForm({ ...pForm, descAr: e.target.value })} placeholder="وصف مختصر (عربي)" className="rounded-xl border border-souq-goldlight px-3 py-2 text-sm" />
              <input value={pForm.descFr} onChange={(e) => setPForm({ ...pForm, descFr: e.target.value })} placeholder="Description (français)" dir="ltr" className="rounded-xl border border-souq-goldlight px-3 py-2 text-sm" />
              <input value={pForm.priceMru} onChange={(e) => setPForm({ ...pForm, priceMru: e.target.value })} placeholder="السعر (أوقية) *" type="number" dir="ltr" className="rounded-xl border border-souq-goldlight px-3 py-2 text-sm" />
              <input value={pForm.stockQty} onChange={(e) => setPForm({ ...pForm, stockQty: e.target.value })} placeholder="الكمية المتوفرة في المخزون *" type="number" dir="ltr" className="rounded-xl border border-souq-goldlight px-3 py-2 text-sm" />
              <select value={pForm.category} onChange={(e) => setPForm({ ...pForm, category: e.target.value, subcategory: "" })} className="rounded-xl border border-souq-goldlight px-3 py-2 bg-white text-sm" aria-label="الفئة">
                <option value="">— الفئة —</option>
                {tree.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.ar}</option>
                ))}
              </select>
              <select value={pForm.subcategory} onChange={(e) => setPForm({ ...pForm, subcategory: e.target.value })} className="rounded-xl border border-souq-goldlight px-3 py-2 bg-white text-sm" aria-label="الفئة الفرعية">
                <option value="">— الفئة الفرعية —</option>
                {activeSubs.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.ar}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {pForm.imageUrl && (
                <img src={pForm.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-souq-goldlight" />
              )}
              <label className="text-sm font-bold border border-souq-green text-souq-green rounded-full px-4 py-2 cursor-pointer">
                📷 صورة المنتج
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadImage(e.target.files && e.target.files[0]); e.target.value = ""; }} />
              </label>
              <button disabled={busy} onClick={saveProduct} className="bg-souq-green text-white font-bold rounded-full px-6 py-2 disabled:opacity-50">
                {busy ? "..." : pForm.id ? "حفظ التعديلات" : "إضافة المنتج"}
              </button>
              {pForm.id && (
                <button onClick={() => setPForm(EMPTY)} className="text-sm font-bold text-souq-ink/50">إلغاء</button>
              )}
              {saved && <span className="text-souq-green font-bold text-sm">تم الحفظ ✓</span>}
            </div>
            {error && <p className="text-red-600 text-sm font-bold mt-2">{error}</p>}
          </div>

          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="bg-white text-souq-ink rounded-2xl p-3 flex items-center gap-3 flex-wrap">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <span className="text-2xl w-12 text-center">🏪</span>
                )}
                <div className="flex-1 min-w-[150px]">
                  <p className="font-bold text-sm">{p.nameAr}</p>
                  <p className="text-xs text-souq-ink/50">{p.priceMru.toLocaleString()} أوقية</p>
                </div>
                <span className={`text-xs font-bold rounded-full px-3 py-1 ${(p.stockQty || 0) > 0 ? "bg-souq-green/10 text-souq-green" : "bg-red-100 text-red-600"}`}>
                  {(p.stockQty || 0) > 0 ? `المخزون: ${p.stockQty}` : "نفذ المخزون"}
                </span>
                <button
                  onClick={() => setPForm({ ...EMPTY, ...p, priceMru: String(p.priceMru), stockQty: String(p.stockQty ?? 0), category: p.category || "", subcategory: p.subcategory || "", imageUrl: p.imageUrl || "" })}
                  className="text-xs font-bold border border-souq-green text-souq-green rounded-full px-3 py-1"
                >
                  تعديل
                </button>
                <button onClick={() => deleteProduct(p.id)} className="text-xs font-bold border border-red-500 text-red-600 rounded-full px-3 py-1">
                  حذف
                </button>
              </div>
            ))}
            {products.length === 0 && <p className="text-center text-white/50 py-8">لا توجد منتجات بعد — أضف أول منتج أعلاه</p>}
          </div>
        </div>
      )}

      {tab === "sales" && (
        <div className="space-y-2">
          {sales.map((s, i) => (
            <div key={i} className="bg-white text-souq-ink rounded-2xl p-3 flex items-center gap-3 flex-wrap text-sm">
              <span className="font-mono text-xs text-souq-ink/50">{s.ref}</span>
              <span className="flex-1 min-w-[150px] font-bold">{s.name}{s.variant ? ` (${s.variant})` : ""}</span>
              <span className="font-black">× {s.qty}</span>
              <span className="font-black text-souq-green">{s.amount.toLocaleString()} أوقية</span>
              <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${s.status === "PAID" || s.status === "COD" ? "bg-souq-green/10 text-souq-green" : "bg-souq-gold/20 text-souq-deep"}`}>
                {s.status === "PAID" || s.status === "COD" ? (s.fulfillment === "DELIVERED" ? "تم التسليم" : "مؤكد") : "بانتظار الدفع"}
              </span>
              {s.customerName && (
                <button
                  onClick={() => {
                    const sameOrder = sales.filter((x) => x.ref === s.ref && x.customerName);
                    openShippingSlip({
                      ref: s.ref,
                      date: s.date,
                      customerName: s.customerName,
                      phone: s.phone,
                      city: s.city,
                      address: s.address,
                      items: sameOrder.map((x) => ({
                        nameAr: x.nameAr, nameFr: x.nameFr, variantLabel: x.variantLabel,
                        qty: x.qty, priceMru: x.priceMru, emoji: x.emoji
                      })),
                      totalMru: sameOrder.reduce((t, x) => t + x.amount, 0),
                      seller: seller.businessName
                    });
                  }}
                  className="text-xs font-bold border border-souq-green text-souq-green rounded-full px-3 py-1"
                >
                  🖨 بوليصة الشحن
                </button>
              )}
            </div>
          ))}
          {sales.length === 0 && <p className="text-center text-white/50 py-8">لا مبيعات بعد</p>}
        </div>
      )}
    </div>
  );
}
