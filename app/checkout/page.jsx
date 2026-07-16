"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../lib/store";
import PhoneInput from "../../components/PhoneInput";

export default function CheckoutPage() {
  const { t, cart, total, clearCart, customer } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({ customerName: "", phone: "", city: "Nouakchott", address: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    if (!customer) return;

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.customer) return;
        setForm((f) => ({
          ...f,
          customerName: f.customerName || data.customer.name || "",
          phone: f.phone || data.customer.phone || ""
        }));
      })
      .catch(() => {});

    fetch("/api/addresses")
      .then((r) => r.json())
      .then((data) => {
        const list = data.addresses || [];
        setSavedAddresses(list);
        // Auto-fill with the most recently used address so returning
        // customers don't have to retype it every time.
        if (list.length > 0) {
          setSelectedAddressId(list[0].id);
          setForm((f) => ({
            ...f,
            city: f.address ? f.city : list[0].city,
            address: f.address ? f.address : list[0].address
          }));
        }
      })
      .catch(() => {});
  }, [customer]);

  const pickAddress = (a) => {
    setSelectedAddressId(a.id);
    setForm({ ...form, city: a.city, address: a.address });
  };

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

      // Save this address to the account's address book for next time,
      // if the customer is logged in and it isn't already saved.
      if (customer) {
        fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: form.city, address: form.address })
        }).catch(() => {});
      }

      clearCart();
      router.push(`/order/${data.ref}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🛒</p>
        <p className="font-bold text-lg">{t("emptyCart")}</p>
        <a href="/" className="inline-block mt-4 bg-souq-green text-white rounded-full px-6 py-2 font-bold">
          {t("shopNow")}
        </a>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-black text-souq-green mb-5">{t("yourInfo")}</h1>

      {customer && savedAddresses.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-bold mb-2">عناويني المحفوظة</p>
          <div className="flex flex-wrap gap-2">
            {savedAddresses.map((a) => (
              <button
                key={a.id}
                onClick={() => pickAddress(a)}
                className={`text-sm rounded-xl border px-3 py-2 text-start ${
                  selectedAddressId === a.id
                    ? "border-souq-green bg-souq-green/10 font-bold"
                    : "border-souq-goldlight bg-white"
                }`}
              >
                {a.city} — {a.address.length > 30 ? a.address.slice(0, 30) + "…" : a.address}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-souq-goldlight/60 p-5 space-y-4">
        <label className="block">
          <span className="text-sm font-bold">{t("fullName")}</span>
          <input
            type="text"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5 focus:outline-none focus:border-souq-green"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold">{t("phone")}</span>
          <PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        </label>

        <label className="block">
          <span className="text-sm font-bold">{t("city")}</span>
          <input
            type="text"
            value={form.city}
            onChange={(e) => {
              setSelectedAddressId(null);
              setForm({ ...form, city: e.target.value });
            }}
            className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5 focus:outline-none focus:border-souq-green"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold">{t("address")}</span>
          <input
            type="text"
            value={form.address}
            onChange={(e) => {
              setSelectedAddressId(null);
              setForm({ ...form, address: e.target.value });
            }}
            className="mt-1 w-full rounded-xl border border-souq-goldlight bg-white px-4 py-2.5 focus:outline-none focus:border-souq-green"
          />
        </label>
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
