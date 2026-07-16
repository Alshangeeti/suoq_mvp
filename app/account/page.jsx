"use client";
import { useEffect, useState } from "react";

const STATUS_LABELS = {
  RECEIVED: { ar: "تم الاستلام", fr: "Reçue" },
  IN_PROGRESS: { ar: "قيد التجهيز", fr: "En préparation" },
  SHIPPED: { ar: "تم الشحن", fr: "Expédiée" },
  DELIVERED: { ar: "تم التسليم", fr: "Livrée" }
};
const STEPS = ["RECEIVED", "IN_PROGRESS", "SHIPPED", "DELIVERED"];

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadMe = async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setCustomer(data.customer);
    setOrders(data.orders || []);
    setLoading(false);
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
        body: JSON.stringify({ phone })
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
        body: JSON.stringify({ phone, code })
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
  };

  if (loading) return <div className="py-16 text-center text-souq-ink/50">...</div>;

  if (!customer) {
    return (
      <div className="py-16 max-w-sm mx-auto" dir="rtl">
        <h1 className="font-black text-xl mb-5 text-center">تسجيل الدخول</h1>

        {step === "phone" && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-bold">رقم الهاتف</span>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="XXXXXXXX"
                className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5"
              />
            </label>
            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
            <button
              disabled={busy || !phone}
              onClick={requestOtp}
              className="w-full bg-souq-green text-white font-bold rounded-full py-2.5 disabled:opacity-50"
            >
              {busy ? "..." : "إرسال رمز عبر واتساب"}
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

  return (
    <div className="py-8" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-black text-xl">حسابي — {customer.phone}</h1>
        <button onClick={logout} className="text-sm font-bold text-souq-green">تسجيل الخروج</button>
      </div>

      <div className="space-y-4">
        {orders.map((o) => {
          let items = [];
          try {
            items = JSON.parse(o.itemsJson || "[]");
          } catch {}
          const currentStepIndex = STEPS.indexOf(o.fulfillmentStatus || "RECEIVED");
          return (
            <div key={o.ref} className="bg-white rounded-2xl border border-souq-goldlight/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold">{o.ref}</span>
                <span className="font-black text-souq-green">{o.totalMru.toLocaleString()} MRU</span>
              </div>

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
    </div>
  );
}
