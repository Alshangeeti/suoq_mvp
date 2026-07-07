"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "../../../lib/store";

export default function OrderPage() {
  const { t } = useStore();
  const { ref } = useParams();
  const [order, setOrder] = useState(null);
  const [merchantCode, setMerchantCode] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${ref}`);
        const data = await res.json();
        if (active && res.ok) {
          setOrder(data.order);
          setMerchantCode(data.merchantCode);
        }
      } catch {}
    };
    load();
    const iv = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [ref]);

  if (!order) return <div className="py-20 text-center font-bold">...</div>;

  const paid = order.status === "PAID";

  return (
    <div className="py-8 max-w-xl mx-auto">
      {paid ? (
        <div className="bg-white rounded-2xl border-2 border-souq-green p-8 text-center">
          <p className="text-5xl mb-3">✅</p>
          <h1 className="text-2xl font-black text-souq-green">{t("paid")}</h1>
          <p className="mt-2 text-souq-ink/70">{t("paidSub")}</p>
          <p className="mt-4 text-sm font-bold">
            {t("orderRef")}: <span className="font-mono">{order.ref}</span>
          </p>
          <Link href="/" className="inline-block mt-6 bg-souq-green text-white rounded-full px-6 py-2 font-bold">
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
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
                <p className="mt-1 font-mono text-2xl font-black tracking-widest text-souq-deep" dir="ltr">{merchantCode}</p>
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
      )}
    </div>
  );
}
