const { DropshipperClient } = require("ae_sdk");
const { prisma } = require("./db");

const APP_KEY = process.env.ALIEXPRESS_APP_KEY || "535648";

function makeClient(session = "") {
  const secret = process.env.ALIEXPRESS_APP_SECRET;
  if (!secret) throw new Error("ALIEXPRESS_APP_SECRET is not set in environment variables");
  return new DropshipperClient({
    app_key: APP_KEY,
    app_secret: secret,
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

function extractTokenPayload(result) {
  // ae_sdk returns { ok, data } — the token fields can be at the top level
  // of data or nested one level down depending on the endpoint version.
  const d = result && result.data ? result.data : {};
  if (d.access_token) return d;
  if (d.data && d.data.access_token) return d.data;
  return null;
}

async function exchangeCode(code) {
  const client = makeClient();
  const result = await client.generateToken({ code });
  const payload = extractTokenPayload(result);
  if (!payload) {
    throw new Error("Token exchange failed: " + JSON.stringify(result).slice(0, 400));
  }
  await storeToken(payload);
  return payload;
}

async function refreshAccessToken() {
  const row = await prisma.appToken.findUnique({ where: { provider: "aliexpress" } });
  if (!row || !row.refreshToken) throw new Error("No refresh token stored");
  const client = makeClient();
  const result = await client.refreshToken({ refresh_token: row.refreshToken });
  const payload = extractTokenPayload(result);
  if (!payload) {
    throw new Error("Token refresh failed: " + JSON.stringify(result).slice(0, 400));
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
