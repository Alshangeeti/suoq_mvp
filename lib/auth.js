const crypto = require("crypto");

function getSecret() {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
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
