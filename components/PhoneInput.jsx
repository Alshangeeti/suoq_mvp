"use client";
import { useState } from "react";
import { COUNTRIES } from "../lib/countries";

// Phone input with a country dial-code dropdown, defaulting to Mauritania.
// `onChange` receives the local number; `onDialChange` (optional) receives
// the selected dial code (e.g. "+222") so callers can build a collision-free
// international identity for non-Mauritanian numbers.
export default function PhoneInput({ value, onChange, onDialChange, placeholder = "XXXXXXXX" }) {
  const [country, setCountry] = useState(COUNTRIES[0]);

  const pick = (code) => {
    const c = COUNTRIES.find((x) => x.code === code) || COUNTRIES[0];
    setCountry(c);
    if (onDialChange) onDialChange(c.dial);
  };

  return (
    <div className="mt-1 flex gap-2" dir="ltr">
      <select
        value={country.code}
        onChange={(e) => pick(e.target.value)}
        className="rounded-xl border border-souq-goldlight bg-white px-2 py-2.5 text-sm font-bold"
        aria-label="country code"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        dir="ltr"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder={placeholder}
        className="flex-1 rounded-xl border border-souq-goldlight bg-white px-4 py-2.5 focus:outline-none focus:border-souq-green"
      />
    </div>
  );
}
