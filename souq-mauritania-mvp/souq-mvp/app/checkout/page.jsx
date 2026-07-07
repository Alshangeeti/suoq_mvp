"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../lib/store";

export default function CheckoutPage() {
  const { t, cart, total, clearCart } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({ customerName: "", phone: "", city: "Nouakchott", address: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!form.customerName || !form.phone || !form.address) {
      setError(t("yourInfo"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: cart })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      clearCart();
      router.push(`/order/${data.ref}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const field = (key, type = "text") => (
    <label className="block">
      <span className="text-sm font-bold">{t(key === "customerName" ? "fullName" : key)}</span>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5 focus:outline-none focus:border-souq-green"
        dir={key === "phone" ? "ltr" : undefined}
      />
    </label>
  );

  return (
    <div className="py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-black text-souq-green mb-5">{t("yourInfo")}</h1>
      <div className="bg-white rounded-2xl border border-souq-goldlight/60 p-5 space-y-4">
        {field("customerName")}
        {field("phone", "tel")}
        {field("city")}
        {field("address")}
      </div>
      <div className="mt-5 bg-souq-green text-white rounded-2xl p-5 flex items-center justify-between">
        <span className="font-bold">{t("total")}</span>
        <span className="font-black text-xl">{total.toLocaleString()} {t("mru")}</span>
      </div>
      {error && <p className="mt-3 text-red-600 text-sm font-bold">{error}</p>}
      <button
        onClick={submit}
        disabled={busy || cart.length === 0}
        className="w-full mt-4 bg-souq-gold text-souq-deep font-black rounded-full py-3 disabled:opacity-50 hover:brightness-105 transition"
      >
        {busy ? "..." : t("placeOrder")}
      </button>
    </div>
  );
}
