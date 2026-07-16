const crypto = require("crypto");
const { DropshipperClient } = require("ae_sdk");
const { prisma } = require("./db");

const APP_KEY = process.env.ALIEXPRESS_APP_KEY || "535648";
const GATEWAY = "https://api-sg.aliexpress.com";

function getSecret() {
  const secret = process.env.ALIEXPRESS_APP_SECRET;
  if (!secret) throw new Error("ALIEXPRESS_APP_SECRET is not set in environment variables");
  return secret;
}

// GOP system-interface signature: HMAC-SHA256 over apiPath + sorted key+value
// pairs, uppercase hex. NOTE: do not include empty params (e.g. session:"") —
// the gateway strips them before verifying, which breaks the signature.
function gopSign(apiPath, params, secret) {
  const base = apiPath + Object.keys(params).sort().map((k) => k + params[k]).join("");
  return crypto.createHmac("sha256", secret).update(base).digest("hex").toUpperCase();
}

async function callAuthApi(apiPath, extraParams) {
  const secret = getSecret();
  const params = {
    app_key: APP_KEY,
    timestamp: String(Date.now()),
    sign_method: "sha256",
    ...extraParams
  };
  params.sign = gopSign(apiPath, params, secret);
  const url = `${GATEWAY}/rest${apiPath}?` + new URLSearchParams(params).toString();
  const res = await fetch(url, { method: "POST" });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Unexpected response: " + text.slice(0, 300));
  }
}

function makeClient(session = "") {
  return new DropshipperClient({
    app_key: APP_KEY,
    app_secret: getSecret(),
    session
  });
}

async function storeToken(data) {
  const expiresIn = parseInt(data.expires_in || "0", 10);
  const expiresAt = data.expire_time
    ? new Date(parseInt(data.expire_time, 10))
    : expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000)
      : null;
  await prisma.appToken.upsert({
    where: { provider: "aliexpress" },
    create: {
      provider: "aliexpress",
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt,
      rawJson: JSON.stringify(data)
    },
    update: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt,
      rawJson: JSON.stringify(data)
    }
  });
}

function extractTokenPayload(data) {
  if (data && data.access_token) return data;
  if (data && data.data && data.data.access_token) return data.data;
  return null;
}

async function exchangeCode(code) {
  const data = await callAuthApi("/auth/token/create", { code });
  const payload = extractTokenPayload(data);
  if (!payload) {
    throw new Error("Token exchange failed: " + JSON.stringify(data).slice(0, 400));
  }
  await storeToken(payload);
  return payload;
}

async function refreshAccessToken() {
  const row = await prisma.appToken.findUnique({ where: { provider: "aliexpress" } });
  if (!row || !row.refreshToken) throw new Error("No refresh token stored");
  const data = await callAuthApi("/auth/token/refresh", { refresh_token: row.refreshToken });
  const payload = extractTokenPayload(data);
  if (!payload) {
    throw new Error("Token refresh failed: " + JSON.stringify(data).slice(0, 400));
  }
  await storeToken(payload);
  return payload;
}

// Returns a DropshipperClient with a valid session token, refreshing if needed.
async function getClient() {
  let row = await prisma.appToken.findUnique({ where: { provider: "aliexpress" } });
  if (!row) throw new Error("AliExpress is not connected — authorize at /callback first");
  if (row.expiresAt && row.expiresAt.getTime() < Date.now() + 60_000) {
    await refreshAccessToken();
    row = await prisma.appToken.findUnique({ where: { provider: "aliexpress" } });
  }
  return makeClient(row.accessToken);
}

async function getTokenStatus() {
  const row = await prisma.appToken.findUnique({ where: { provider: "aliexpress" } });
  if (!row) return { connected: false };
  const expired = row.expiresAt ? row.expiresAt.getTime() < Date.now() : false;
  return {
    connected: true,
    expired,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString()
  };
}

function authorizeUrl() {
  const redirect = "https://souqmauritania.com/callback";
  return (
    `https://api-sg.aliexpress.com/oauth/authorize?response_type=code&force_auth=true` +
    `&client_id=${APP_KEY}&redirect_uri=${encodeURIComponent(redirect)}`
  );
}

module.exports = {
  exchangeCode,
  refreshAccessToken,
  getClient,
  getTokenStatus,
  authorizeUrl,
  APP_KEY
};
