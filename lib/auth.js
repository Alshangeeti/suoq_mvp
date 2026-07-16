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

function createSessionToken(phone) {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const payload = `${phone}|${expires}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

function verifySessionToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [phone, expires, sig] = decoded.split("|");
    if (!phone || !expires || !sig) return null;
    const expected = sign(`${phone}|${expires}`);
    if (expected !== sig) return null;
    if (Date.now() > Number(expires)) return null;
    return { phone };
  } catch {
    return null;
  }
}

module.exports = { createSessionToken, verifySessionToken };
