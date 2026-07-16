"use client";
import { useState } from "react";
import { COUNTRIES } from "../lib/countries";

// A phone input with a country dial-code dropdown, defaulting to Mauritania.
// `value`/`onChange` only ever deal with the local number the person types
// (digits only) — the dial code is a UX aid, matching how phone numbers are
// already matched/stored (last 8 digits) throughout the app.
export default function PhoneInput({ value, onChange, placeholder = "XXXXXXXX" }) {
  const [country, setCountry] = useState(COUNTRIES[0]);

  return (
    <div className="mt-1 flex gap-2" dir="ltr">
      <select
        value={country.code}
        onChange={(e) => setCountry(COUNTRIES.find((c) => c.code === e.target.value) || COUNTRIES[0])}
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-xl border border-souq-goldlight bg-white px-4 py-2.5 focus:outline-none focus:border-souq-green"
      />
    </div>
  );
}
