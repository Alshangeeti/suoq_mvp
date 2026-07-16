const crypto = require("crypto");

// Timing-safe admin key check. Returns false when ADMIN_KEY is unset
// (fail closed) or on any mismatch, without leaking length/prefix timing.
function isAdmin(req) {
  const expected = process.env.ADMIN_KEY;
  const given = req.headers.get("x-admin-key");
  if (!expected || !given) return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = { isAdmin };
