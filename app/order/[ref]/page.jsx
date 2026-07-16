"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "../../../lib/store";

const STEPS = ["RECEIVED", "IN_PROGRESS", "SHIPPED", "DELIVERED"];
const STEP_KEYS = { RECEIVED: "stReceived", IN_PROGRESS: "stInProgress", SHIPPED: "stShipped", DELIVERED: "stDelivered" };

export default function OrderPage() {
  const { t } = useStore();
  const { ref } = useParams();
  const [order, setOrder] = useState(null);
  const [payInfo, setPayInfo] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [refInput, setRefInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let iv = null;
    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${ref}`);
        if (res.status === 404) {
          if (active) setNotFound(true);
          if (iv) clearInterval(iv);
          return;
        }
        const data = await res.json();
        if (active && res.ok) {
          setOrder(data.order);
          setPayInfo(data.payInfo || {});
          const done = data.order && (data.order.status === "PAID" || data.order.status === "COD");
          const manualWaiting = data.order && data.order.status === "PENDING_VERIFICATION";
          if ((done || manualWaiting) && iv) clearInterval(iv);
        }
      } catch {}
    };
    load();
    iv = setInterval(load, 4000);
    return () => {
      active = false;
      if (iv) clearInterval(iv);
    };
  }, [ref]);

  const submitRef = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${ref}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRef: refInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      setOrder((o) => ({ ...o, status: "PENDING_VERIFICATION", paymentRef: refInput }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (notFound)
    return (
      <div className="py-20 text-center">
        <p className="text-4xl mb-3">🔎</p>
        <p className="font-bold text-lg">{t("orderNotFound")}</p>
        <Link href="/" className="inline-block mt-4 bg-souq-green text-white rounded-full px-6 py-2 font-bold">
          {t("continueShopping")}
        </Link>
      </div>
    );

  if (!order) return <div className="py-20 text-center font-bold" aria-busy="true">...</div>;

  const confirmed = order.status === "PAID" || order.status === "COD";
  const pendingVerification = order.status === "PENDING_VERIFICATION";
  const currentStepIndex = STEPS.indexOf(order.fulfillmentStatus || "RECEIVED");

  const timeline = (
    <div className="mt-6">
      <p className="font-bold mb-3">{t("orderTimeline")}</p>
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex items-center">
            <div className={`w-4 h-4 rounded-full ${i <= currentStepIndex ? "bg-souq-green" : "bg-souq-goldlight"}`} />
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-1 rounded ${i < currentStepIndex ? "bg-souq-green" : "bg-souq-goldlight"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[11px] font-bold text-souq-ink/60">
        {STEPS.map((s, i) => (
          <span key={s} className={i <= currentStepIndex ? "text-souq-green" : ""}>{t(STEP_KEYS[s])}</span>
        ))}
      </div>
    </div>
  );

  if (confirmed) {
    const cod = order.status === "COD";
    return (
      <div className="py-8 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-souq-green p-8 text-center">
          <p className="text-5xl mb-3">{cod ? "📦" : "✅"}</p>
          <h1 className="text-2xl font-black text-souq-green">{cod ? t("codConfirmedTitle") : t("paid")}</h1>
          <p className="mt-2 text-souq-ink/70">{cod ? t("codConfirmedSub") : t("paidSub")}</p>
          <p className="mt-4 text-sm font-bold">
            {t("orderRef")}: <span className="font-mono">{order.ref}</span>
          </p>
          {timeline}
          <Link href="/" className="inline-block mt-6 bg-souq-green text-white rounded-full px-6 py-2 font-bold">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <div className="py-8 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-souq-gold p-8 text-center">
          <p className="text-5xl mb-3">🕐</p>
          <h1 className="text-2xl font-black text-souq-deep">{t("pendingVerification")}</h1>
          <p className="mt-2 text-souq-ink/70">{t("pendingVerificationSub")}</p>
          <p className="mt-4 text-sm font-bold">
            {t("orderRef")}: <span className="font-mono">{order.ref}</span>
          </p>
          {order.paymentRef && (
            <p className="mt-1 text-sm text-souq-ink/60">
              {t("refLabel")}: <span className="font-mono">{order.paymentRef}</span>
            </p>
          )}
          <Link href="/" className="inline-block mt-6 bg-souq-green text-white rounded-full px-6 py-2 font-bold">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  // PENDING_PAYMENT — show method-specific instructions
  const method = order.paymentMethod || "BANKILY";

  if (method === "BANKILY") {
    return (
      <div className="py-8 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-souq-goldlight/60 p-6">
          <h1 className="text-2xl font-black text-souq-green">{t("payTitle")}</h1>
          <p className="mt-1 text-sm font-bold text-souq-ink/60">
            {t("orderRef")}: <span className="font-mono">{order.ref}</span>
          </p>
          <ol className="mt-5 space-y-4">
            <li className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-full bg-souq-green text-white flex items-center justify-center font-bold shrink-0">1</span>
              <p className="font-semibold pt-0.5">{t("payStep1")}</p>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-full bg-souq-green text-white flex items-center justify-center font-bold shrink-0">2</span>
              <div className="pt-0.5">
                <p className="font-semibold">{t("payStep2")}</p>
                <p className="mt-1 font-mono text-2xl font-black tracking-widest text-souq-deep" dir="ltr">
                  {payInfo.bankilyMerchantCode || "—"}
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-full bg-souq-green text-white flex items-center justify-center font-bold shrink-0">3</span>
              <div className="pt-0.5">
                <p className="font-semibold">{t("payStep3")}</p>
                <p className="mt-1 text-2xl font-black text-souq-green" dir="ltr">
                  {order.totalMru.toLocaleString()} MRU
                </p>
              </div>
            </li>
          </ol>
          <div className="mt-6 bg-souq-gold/15 border border-souq-gold/50 rounded-xl p-4 text-sm font-semibold">
            {t("payNote")}
          </div>
          <div className="mt-5 flex items-center gap-2 text-souq-ink/60 font-bold text-sm">
            <span className="w-3 h-3 rounded-full bg-souq-gold animate-pulse"></span>
            {t("waiting")}
          </div>
        </div>
      </div>
    );
  }

  // Manual methods: MASRVI / SEDAD / BANK
  const target =
    method === "MASRVI" ? payInfo.masrviNumber :
    method === "SEDAD" ? payInfo.sedadNumber :
    payInfo.bankDetails;
  const label = method === "BANK" ? t("bankDetails") : t("payToNumber");

  return (
    <div className="py-8 max-w-xl mx-auto">
      <div className="bg-white rounded-2xl border border-souq-goldlight/60 p-6">
        <h1 className="text-2xl font-black text-souq-green">
          {method === "MASRVI" ? t("payMasrvi") : method === "SEDAD" ? t("paySedad") : t("payBank")}
        </h1>
        <p className="mt-1 text-sm font-bold text-souq-ink/60">
          {t("orderRef")}: <span className="font-mono">{order.ref}</span>
        </p>

        <div className="mt-5">
          <p className="font-semibold">{label}</p>
          {target ? (
            <p className="mt-1 font-mono text-xl font-black text-souq-deep whitespace-pre-wrap" dir="ltr">{target}</p>
          ) : (
            <p className="mt-1 text-souq-ink/60 font-bold">{t("notConfigured")}</p>
          )}
          <p className="mt-3 font-semibold">{t("payStep3")}</p>
          <p className="mt-1 text-2xl font-black text-souq-green" dir="ltr">
            {order.totalMru.toLocaleString()} MRU
          </p>
        </div>

        <div className="mt-6">
          <label className="block">
            <span className="text-sm font-bold">{t("refLabel")}</span>
            <input
              type="text"
              dir="ltr"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5 focus:outline-none focus:border-souq-green"
            />
          </label>
          {error && <p className="text-red-600 text-sm font-bold mt-2">{error}</p>}
          <button
            disabled={busy || !refInput.trim()}
            onClick={submitRef}
            className="w-full mt-3 bg-souq-gold text-souq-deep font-black rounded-full py-3 disabled:opacity-50"
          >
            {busy ? "..." : t("submitRef")}
          </button>
        </div>
      </div>
    </div>
  );
}
