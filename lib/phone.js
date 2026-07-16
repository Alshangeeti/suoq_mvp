const crypto = require("crypto");

// Normalizes a phone into the canonical account/order identity string.
// Mauritanian numbers (+222, the default) keep the legacy 8-digit form so
// existing accounts and Bankily SMS matching (which sees local numbers)
// keep working. Foreign numbers are prefixed with their dial code digits so
// e.g. +33 xxxxxxxx can never collide with a Mauritanian +222 xxxxxxxx.
function normalizePhone(phone, dialCode) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const dial = String(dialCode || "+222").replace(/\D/g, "");
  if (dial === "222" || dial === "") {
    return digits.slice(-8);
  }
  return dial + digits.replace(/^0+/, "");
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

module.exports = { normalizePhone, hashOtp };
