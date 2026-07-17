"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "../../lib/store";
import PhoneInput from "../../components/PhoneInput";

const STATUS_LABELS = {
  RECEIVED: { ar: "تم الاستلام", fr: "Reçue" },
  IN_PROGRESS: { ar: "قيد التجهيز", fr: "En préparation" },
  SHIPPED: { ar: "تم الشحن", fr: "Expédiée" },
  DELIVERED: { ar: "تم التسليم", fr: "Livrée" }
};
const STEPS = ["RECEIVED", "IN_PROGRESS", "SHIPPED", "DELIVERED"];

export default function AccountPage() {
  const { setCustomer: setGlobalCustomer, cart, setQty, total, t, lang } = useStore();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [newAddr, setNewAddr] = useState({ city: "Nouakchott", address: "" });
  const [tab, setTab] = useState("profile");

  // Login flow state
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+222");
  const [loginMethod, setLoginMethod] = useState("phone"); // "phone" | "email"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({ name: "", gender: "", age: "" });
  const [profileSaved, setProfileSaved] = useState(false);

  const isProfileComplete = (c) => !!(c && c.name && c.gender && c.age);

  const loadMe = async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setCustomer(data.customer);
    setOrders(data.orders || []);
    setLoading(false);
    if (data.customer && setGlobalCustomer) setGlobalCustomer(data.customer);
    if (data.customer) {
      setProfileForm({
        name: data.customer.name || "",
        gender: data.customer.gender || "",
        age: data.customer.age || ""
      });
      setTab(isProfileComplete(data.customer) ? "orders" : "profile");
      loadAddresses();
    }
  };

  const loadAddresses = async () => {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    setAddresses(data.addresses || []);
  };

  useEffect(() => {
    loadMe();
  }, []);

  const requestOtp = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginMethod === "email" ? { email } : { phone, dialCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDevCode(data.testMode ? data.devCode : null);
      setStep("otp");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginMethod === "email" ? { email, code } : { phone, code, dialCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await loadMe();
      setStep("phone");
      setPhone("");
      setCode("");
      setDevCode(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCustomer(null);
    setOrders([]);
    if (setGlobalCustomer) setGlobalCustomer(null);
  };

  const saveProfile = async () => {
    setError("");
    setBusy(true);
    setProfileSaved(false);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await loadMe();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const addAddress = async () => {
    if (!newAddr.city || !newAddr.address) return;
    setBusy(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddr)
      });
      const data = await res.json();
      setAddresses(data.addresses || []);
      setNewAddr({ city: "Nouakchott", address: "" });
    } finally {
      setBusy(false);
    }
  };

  const removeAddress = async (id) => {
    const res = await fetch("/api/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    setAddresses(data.addresses || []);
  };

  if (loading) return <div className="py-16 text-center text-souq-ink/50">...</div>;

  // ---------- Logged out: phone + OTP login ----------
  if (!customer) {
    return (
      <div className="py-16 max-w-sm mx-auto" dir="rtl">
        <h1 className="font-black text-xl mb-5 text-center">تسجيل الدخول</h1>

        {step === "phone" && (
          <div className="space-y-3">
            <div className="flex gap-1 bg-white rounded-full border border-souq-goldlight/60 p-1">
              <button
                onClick={() => setLoginMethod("phone")}
                className={`flex-1 text-sm font-bold rounded-full py-2 ${loginMethod === "phone" ? "bg-souq-green text-white" : "text-souq-ink/70"}`}
              >
                📱 واتساب
              </button>
              <button
                onClick={() => setLoginMethod("email")}
                className={`flex-1 text-sm font-bold rounded-full py-2 ${loginMethod === "email" ? "bg-souq-green text-white" : "text-souq-ink/70"}`}
              >
                ✉️ البريد الإلكتروني
              </button>
            </div>

            {loginMethod === "phone" ? (
              <label className="block">
                <span className="text-sm font-bold">رقم الهاتف</span>
                <PhoneInput value={phone} onChange={setPhone} onDialChange={setDialCode} />
              </label>
            ) : (
              <label className="block">
                <span className="text-sm font-bold">البريد الإلكتروني</span>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5"
                />
              </label>
            )}
            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
            <button
              disabled={busy || (loginMethod === "phone" ? !phone : !email)}
              onClick={requestOtp}
              className="w-full bg-souq-green text-white font-bold rounded-full py-2.5 disabled:opacity-50"
            >
              {busy ? "..." : loginMethod === "phone" ? "إرسال رمز عبر واتساب" : "إرسال رمز إلى بريدك"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-3">
            {devCode && (
              <div className="bg-souq-gold/20 border border-souq-gold rounded-xl p-3 text-sm">
                <p className="font-bold">وضع الاختبار — واتساب غير مفعّل بعد</p>
                <p>رمزك هو: <span className="font-mono font-black">{devCode}</span></p>
              </div>
            )}
            <label className="block">
              <span className="text-sm font-bold">رمز التحقق</span>
              <input
                type="text"
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5"
              />
            </label>
            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
            <button
              disabled={busy || !code}
              onClick={verifyOtp}
              className="w-full bg-souq-green text-white font-bold rounded-full py-2.5 disabled:opacity-50"
            >
              {busy ? "..." : "تأكيد"}
            </button>
            <button onClick={() => setStep("phone")} className="w-full text-sm text-souq-ink/60">
              تغيير الرقم
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------- Logged in: profile / orders / cart ----------
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="py-8" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {customer.gender && (
            <img
              src={customer.gender === "male" ? "/avatars/man-daraa.svg" : "/avatars/woman-melhfa.svg"}
              width="48"
              height="48"
              alt=""
              className="rounded-full border-2 border-souq-gold"
            />
          )}
          <div>
            <h1 className="font-black text-xl">{customer.name ? `مرحباً ${customer.name}` : "حسابي"}</h1>
            <p className="text-xs text-souq-ink/50" dir="ltr">{customer.phone || customer.email}</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm font-bold text-souq-green">تسجيل الخروج</button>
      </div>

      {!isProfileComplete(customer) && (
        <p className="text-sm text-souq-gold-deep bg-souq-gold/20 border border-souq-gold rounded-xl px-3 py-2 mb-4">
          أكمل ملفك الشخصي حتى لا تحتاج لإدخال بياناتك في كل مرة تشتري فيها
        </p>
      )}

      <div className="flex gap-1 mb-5 bg-white rounded-full border border-souq-goldlight/60 p-1">
        {[
          ["profile", "الملف الشخصي"],
          ["orders", `طلباتي${orders.length ? ` (${orders.length})` : ""}`],
          ["cart", `السلة${cartCount ? ` (${cartCount})` : ""}`]
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 text-sm font-bold rounded-full py-2 transition ${
              tab === key ? "bg-souq-green text-white" : "text-souq-ink/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-souq-goldlight/60 p-4 space-y-3">
            <label className="block">
              <span className="text-sm font-bold">الاسم الكامل</span>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5"
              />
            </label>

            <div>
              <span className="text-sm font-bold block mb-2">الجنس</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setProfileForm({ ...profileForm, gender: "male" })}
                  className={`flex-1 rounded-xl border-2 py-3 font-bold flex flex-col items-center gap-2 ${
                    profileForm.gender === "male" ? "border-souq-green bg-souq-green/10" : "border-souq-goldlight"
                  }`}
                >
                  <img src="/avatars/man-daraa.svg" width="56" height="56" alt="" className="rounded-full" />
                  ذكر
                </button>
                <button
                  onClick={() => setProfileForm({ ...profileForm, gender: "female" })}
                  className={`flex-1 rounded-xl border-2 py-3 font-bold flex flex-col items-center gap-2 ${
                    profileForm.gender === "female" ? "border-souq-green bg-souq-green/10" : "border-souq-goldlight"
                  }`}
                >
                  <img src="/avatars/woman-melhfa.svg" width="56" height="56" alt="" className="rounded-full" />
                  أنثى
                </button>
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-bold">العمر</span>
              <input
                type="number"
                dir="ltr"
                min="1"
                max="119"
                value={profileForm.age}
                onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5"
              />
            </label>

            {customer.phone && (
              <label className="block">
                <span className="text-sm font-bold">رقم الهاتف</span>
                <input
                  type="text"
                  dir="ltr"
                  disabled
                  value={customer.phone}
                  className="mt-1 w-full rounded-xl border border-souq-goldlight bg-souq-sand px-4 py-2.5 text-souq-ink/60"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-bold">البريد الإلكتروني</span>
              {customer.email ? (
                <input
                  type="text"
                  dir="ltr"
                  disabled
                  value={customer.email}
                  className="mt-1 w-full rounded-xl border border-souq-goldlight bg-souq-sand px-4 py-2.5 text-souq-ink/60"
                />
              ) : (
                <input
                  type="email"
                  dir="ltr"
                  value={profileForm.email || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5"
                />
              )}
            </label>

            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
            {profileSaved && <p className="text-souq-green text-sm font-bold">تم الحفظ ✓</p>}
            <button
              disabled={busy}
              onClick={saveProfile}
              className="w-full bg-souq-green text-white font-bold rounded-full py-2.5 disabled:opacity-50"
            >
              {busy ? "..." : "حفظ"}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-souq-goldlight/60 p-4">
            <p className="font-bold mb-3">عناويني</p>
            <div className="space-y-2 mb-3">
              {addresses.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm bg-souq-sand rounded-xl px-3 py-2">
                  <span>{a.city} — {a.address}</span>
                  <button onClick={() => removeAddress(a.id)} className="text-red-600 font-bold text-xs">حذف</button>
                </div>
              ))}
              {addresses.length === 0 && <p className="text-sm text-souq-ink/40">لا توجد عناوين محفوظة</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                placeholder="المدينة"
                className="flex-1 min-w-[100px] rounded-xl border border-souq-goldlight bg-white px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={newAddr.address}
                onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                placeholder="العنوان بالتفصيل"
                className="flex-[2] min-w-[150px] rounded-xl border border-souq-goldlight bg-white px-3 py-2 text-sm"
              />
              <button
                disabled={busy}
                onClick={addAddress}
                className="text-sm font-bold bg-souq-green text-white rounded-xl px-4 py-2 disabled:opacity-50"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          {orders.map((o) => {
            let items = [];
            try {
              items = JSON.parse(o.itemsJson || "[]");
            } catch {}
            const currentStepIndex = STEPS.indexOf(o.fulfillmentStatus || "RECEIVED");
            const confirmed = o.status === "PAID" || o.status === "COD";
            const rejected = o.status === "REJECTED";
            const awaitingPayment = o.status === "PENDING_PAYMENT";
            const awaitingVerification = o.status === "PENDING_VERIFICATION";
            return (
              <div key={o.ref} className={`bg-white rounded-2xl border p-4 ${rejected ? "border-red-300" : "border-souq-goldlight/60"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold">{o.ref}</span>
                  <span className="font-black text-souq-green">{o.totalMru.toLocaleString()} MRU</span>
                </div>

                {rejected && (
                  <div className="my-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    <p className="text-sm font-black text-red-600">{t("orderRejected")}</p>
                    <p className="text-sm text-red-700 mt-0.5">
                      {t("reasonLabel")}: {t("r" + o.rejectionReason) !== "r" + o.rejectionReason ? t("r" + o.rejectionReason) : o.rejectionReason}
                      {o.rejectionNote ? ` — ${o.rejectionNote}` : ""}
                    </p>
                  </div>
                )}

                {awaitingPayment && (
                  <div className="my-3 flex items-center justify-between bg-souq-gold/15 border border-souq-gold/50 rounded-xl px-3 py-2">
                    <span className="text-sm font-black text-souq-deep flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-souq-gold animate-pulse" />
                      {t("pendingPayment")}
                    </span>
                    <Link href={`/order/${o.ref}`} className="text-sm font-bold bg-souq-green text-white rounded-full px-4 py-1.5">
                      {t("completePayment")}
                    </Link>
                  </div>
                )}

                {awaitingVerification && (
                  <div className="my-3 bg-souq-gold/15 border border-souq-gold/50 rounded-xl px-3 py-2">
                    <span className="text-sm font-black text-souq-deep">🕐 {t("pendingVerification")}</span>
                  </div>
                )}

                {confirmed && (
                <>
                <div className="flex items-center gap-1 my-3">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex-1 flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          i <= currentStepIndex ? "bg-souq-green" : "bg-souq-goldlight"
                        }`}
                      />
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 ${i < currentStepIndex ? "bg-souq-green" : "bg-souq-goldlight"}`} />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-souq-green mb-3">
                  {STATUS_LABELS[o.fulfillmentStatus]?.ar || o.fulfillmentStatus}
                </p>
                </>
                )}

                <div className="text-sm space-y-1 border-t border-souq-goldlight/40 pt-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-souq-ink/80">
                      <span>{it.emoji} {it.nameAr || it.nameFr} × {it.qty}</span>
                      <span>{(it.priceMru * it.qty).toLocaleString()} MRU</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {orders.length === 0 && <p className="text-center text-souq-ink/50 py-10">لا توجد طلبات بعد</p>}
        </div>
      )}

      {tab === "cart" && (
        <div>
          {cart.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-bold">{t("emptyCart")}</p>
              <Link href="/" className="inline-block mt-4 bg-souq-green text-white rounded-full px-6 py-2 font-bold">
                {t("shopNow")}
              </Link>
            </div>
          ) : (
            <div>
              <div className="space-y-3">
                {cart.map((i) => (
                  <div key={i.id} className="bg-white rounded-2xl border border-souq-goldlight/60 p-4 flex items-center gap-4">
                    <span className="text-3xl">{i.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold">{lang === "ar" ? i.nameAr : i.nameFr}</p>
                      <p className="text-sm text-souq-green font-bold">
                        {i.priceMru.toLocaleString()} {t("mru")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="decrease quantity" className="w-8 h-8 rounded-full bg-souq-sand font-bold">−</button>
                      <span className="w-6 text-center font-bold">{i.qty}</span>
                      <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="increase quantity" className="w-8 h-8 rounded-full bg-souq-sand font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-souq-green text-white rounded-2xl p-5 flex items-center justify-between">
                <span className="font-bold">{t("total")}</span>
                <span className="font-black text-xl">{total.toLocaleString()} {t("mru")}</span>
              </div>
              <Link
                href="/checkout"
                className="block text-center mt-4 bg-souq-gold text-souq-deep font-black rounded-full py-3 hover:brightness-105 transition"
              >
                {t("checkout")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
