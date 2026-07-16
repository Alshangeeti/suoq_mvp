const crypto = require("crypto");
const { prisma } = require("./db");

const APP_KEY = process.env.ALIEXPRESS_APP_KEY || "535648";
const GATEWAY = "https://api-sg.aliexpress.com";

// AliExpress Open Platform (GOP) signature: HMAC-SHA256 over the API path
// followed by all params concatenated as key+value in sorted key order,
// uppercase hex, using the App Secret.
function gopSign(apiPath, params, secret) {
  const sorted = Object.keys(params).sort();
  let base = apiPath;
  for (const k of sorted) base += k + params[k];
  return crypto.createHmac("sha256", secret).update(base).digest("hex").toUpperCase();
}

async function callAuthApi(apiPath, extraParams) {
  const secret = process.env.ALIEXPRESS_APP_SECRET;
  if (!secret) throw new Error("ALIEXPRESS_APP_SECRET is not set in environment variables");

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
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Unexpected response: " + text.slice(0, 300));
  }
  return data;
}

async function storeToken(data) {
  const expiresIn = parseInt(data.expires_in || data.expire_time || "0", 10);
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

async function exchangeCode(code) {
  const data = await callAuthApi("/auth/token/create", { code });
  if (!data.access_token) {
    throw new Error("Token exchange failed: " + JSON.stringify(data).slice(0, 300));
  }
  await storeToken(data);
  return data;
}

async function refreshAccessToken() {
  const row = await prisma.appToken.findUnique({ where: { provider: "aliexpress" } });
  if (!row || !row.refreshToken) throw new Error("No refresh token stored");
  const data = await callAuthApi("/auth/token/refresh", { refresh_token: row.refreshToken });
  if (!data.access_token) {
    throw new Error("Token refresh failed: " + JSON.stringify(data).slice(0, 300));
  }
  await storeToken(data);
  return data;
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
    `${GATEWAY}/oauth/authorize?response_type=code&force_auth=true` +
    `&client_id=${APP_KEY}&redirect_uri=${encodeURIComponent(redirect)}`
  );
}

module.exports = { exchangeCode, refreshAccessToken, getTokenStatus, authorizeUrl, APP_KEY };
