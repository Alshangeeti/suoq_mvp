export const dynamic = "force-dynamic";
import crypto from "crypto";

const DEBUG_KEY = "ffccfb0d7b401ea63999c55c";
const GATEWAY = "https://api-sg.aliexpress.com";

function hmacSha256Upper(secret, base) {
  return crypto.createHmac("sha256", secret).update(base).digest("hex").toUpperCase();
}
function md5TopUpper(secret, sortedKV) {
  return crypto.createHash("md5").update(secret + sortedKV + secret).digest("hex").toUpperCase();
}

function sortedConcat(params) {
  return Object.keys(params).sort().map((k) => k + params[k]).join("");
}

async function tryVariant(name, url) {
  try {
    const res = await fetch(url, { method: "POST" });
    const text = await res.text();
    let code = "";
    try {
      const j = JSON.parse(text);
      code = j.code || (j.error_response && j.error_response.code) || "";
    } catch {}
    return { name, status: res.status, code: String(code), body: text.slice(0, 220) };
  } catch (e) {
    return { name, status: 0, code: "FETCH_ERROR", body: String(e).slice(0, 200) };
  }
}

async function runDiagnostics(searchParams) {
  if (searchParams?.key !== DEBUG_KEY) {
    return { env: null, results: [], summary: "UNAUTHORIZED" };
  }

  const appKey = process.env.ALIEXPRESS_APP_KEY || "535648";
  const secret = process.env.ALIEXPRESS_APP_SECRET || "";
  const code = "dummy_test_code_123";
  const results = [];

  const env = {
    appKeyInUse: appKey,
    appKeyLength: appKey.length,
    appKeyHasWhitespace: appKey !== appKey.trim(),
    secretPresent: !!secret,
    secretLength: secret.length,
    secretHasWhitespace: secret !== secret.trim()
  };

  if (secret) {
    const ts = String(Date.now());
    const path = "/auth/token/create";

    // V1: GOP — path + sorted params, hmac-sha256
    {
      const p = { app_key: appKey, timestamp: ts, sign_method: "sha256", code };
      const sign = hmacSha256Upper(secret, path + sortedConcat(p));
      const url = `${GATEWAY}/rest${path}?` + new URLSearchParams({ ...p, sign }).toString();
      results.push(await tryVariant("V1 GOP basic", url));
    }
    // V2: GOP + simplify + empty session (ae_sdk style)
    {
      const p = { app_key: appKey, timestamp: ts, sign_method: "sha256", code, simplify: "true", session: "" };
      const sign = hmacSha256Upper(secret, path + sortedConcat(p));
      const url = `${GATEWAY}/rest${path}?` + new URLSearchParams({ ...p, sign }).toString();
      results.push(await tryVariant("V2 GOP ae_sdk-style", url));
    }
    // V3: GOP without path prefix in base string
    {
      const p = { app_key: appKey, timestamp: ts, sign_method: "sha256", code };
      const sign = hmacSha256Upper(secret, sortedConcat(p));
      const url = `${GATEWAY}/rest${path}?` + new URLSearchParams({ ...p, sign }).toString();
      results.push(await tryVariant("V3 no-path base", url));
    }
    // V4: TOP /sync with method param, hmac-sha256 over sorted incl. method
    {
      const p = {
        method: "taobao.top.auth.token.create",
        app_key: appKey,
        timestamp: ts,
        sign_method: "sha256",
        code,
        format: "json",
        v: "2.0"
      };
      const sign = hmacSha256Upper(secret, sortedConcat(p));
      const url = `${GATEWAY}/sync?` + new URLSearchParams({ ...p, sign }).toString();
      results.push(await tryVariant("V4 TOP sync sha256", url));
    }
    // V5: GOP with md5 TOP-style signing
    {
      const p = { app_key: appKey, timestamp: ts, sign_method: "md5", code };
      const sign = md5TopUpper(secret, sortedConcat(p));
      const url = `${GATEWAY}/rest${path}?` + new URLSearchParams({ ...p, sign }).toString();
      results.push(await tryVariant("V5 GOP md5", url));
    }
  }

  const summary =
    `kL${env.appKeyLength}${env.appKeyHasWhitespace ? "WS" : ""}` +
    `_sL${env.secretLength}${env.secretHasWhitespace ? "WS" : ""}` +
    "__" +
    results.map((r) => `${r.name.split(" ")[0]}=${r.code || r.status}`).join("_");
  return { env, results, summary };
}

export async function generateMetadata({ searchParams }) {
  const { summary } = await runDiagnostics(searchParams);
  return { title: summary };
}

export default async function DebugAE({ searchParams }) {
  const { env, results } = await runDiagnostics(searchParams);
  return (
    <div className="py-10" dir="ltr">
      <h1 className="font-black text-xl mb-4">AE Debug</h1>
      <pre className="text-xs whitespace-pre-wrap bg-white rounded-xl border p-4">
        {JSON.stringify({ env, results }, null, 2)}
      </pre>
    </div>
  );
}
