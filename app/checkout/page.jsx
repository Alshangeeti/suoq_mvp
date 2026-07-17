"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../lib/store";
import PhoneInput from "../../components/PhoneInput";
import { PAYMENT_METHODS } from "../../lib/payments";
import MapPicker from "../../components/MapPicker";

export default function CheckoutPage() {
  const { t, cart, total, clearCart, customer } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({ customerName: "", phone: "", city: "Nouakchott", address: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("BANKILY");
  const [showMap, setShowMap] = useState(false);

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
        body: JSON.stringify({ ...form, items: cart, paymentMethod })
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

        {!showMap ? (
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="text-sm font-bold border border-souq-green text-souq-green rounded-full px-4 py-2"
          >
            {t("pickOnMap")}
          </button>
        ) : (
          <MapPicker
            labels={{
              useMyLocation: t("useMyLocation"),
              confirm: t("confirmLocation"),
              cancel: t("cancel"),
              locationDenied: t("locationDenied")
            }}
            onPick={(p) => {
              setSelectedAddressId(null);
              setForm({ ...form, city: p.city, address: p.address });
              setShowMap(false);
            }}
            onClose={() => setShowMap(false)}
          />
        )}
      </div>

      <div className="mt-5 bg-white rounded-2xl border border-souq-goldlight/60 p-5">
        <p className="font-bold mb-3">{t("payMethod")}</p>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaymentMethod(m.id)}
              className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-start transition ${
                paymentMethod === m.id ? "border-souq-green bg-souq-green/5" : "border-souq-goldlight bg-white"
              }`}
            >
              {m.logo ? (
                <img
                  src={m.logo}
                  alt=""
                  className="w-10 h-10 rounded-lg object-contain bg-white"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextSibling.style.display = "inline";
                  }}
                />
              ) : null}
              <span className="text-2xl" style={m.logo ? { display: "none" } : undefined}>{m.icon}</span>
              <span className="flex-1">
                <span className="font-bold block">{t(m.labelKey)}</span>
                <span className="text-xs text-souq-ink/60">{t(m.descKey)}</span>
              </span>
              <span
                className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                  paymentMethod === m.id ? "border-souq-green bg-souq-green" : "border-souq-goldlight"
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 bg-souq-green text-white rounded-2xl p-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">{t("delivery")}</span>
          <span className="font-bold text-souq-goldlight">{t("deliveryFree")}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/20 pt-2">
          <span className="font-bold">{t("total")}</span>
          <span className="font-black text-xl">{total.toLocaleString()} {t("mru")}</span>
        </div>
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
