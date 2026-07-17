const crypto = require("crypto");

let warned = false;
function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (!warned && process.env.NODE_ENV === "production") {
      warned = true;
      console.error(
        "[SECURITY] SESSION_SECRET is not set — customer sessions are signed with a " +
        "publicly known default. Set SESSION_SECRET in Vercel env vars before launch."
      );
    }
    return "dev-insecure-secret-change-me";
  }
  return secret;
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

// `sub` identifies the customer: "id:<customerId>" for new sessions, or a
// bare phone string for legacy cookies issued before email login existed.
function createSessionToken(sub) {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const payload = `${sub}|${expires}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

function verifySessionToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [sub, expires, sig] = decoded.split("|");
    if (!sub || !expires || !sig) return null;
    const expected = sign(`${sub}|${expires}`);
    if (expected !== sig) return null;
    if (Date.now() > Number(expires)) return null;
    return { sub, phone: sub.startsWith("id:") ? null : sub };
  } catch {
    return null;
  }
}

module.exports = { createSessionToken, verifySessionToken };
