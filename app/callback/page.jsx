export const dynamic = "force-dynamic";
import { exchangeCode, getTokenStatus, authorizeUrl } from "../../lib/aliexpress";

export const metadata = { title: "AliExpress Connection" };

export default async function CallbackPage({ searchParams }) {
  const code = searchParams?.code;
  let result = null;
  let error = null;

  if (code) {
    try {
      await exchangeCode(code);
      result = "connected";
    } catch (e) {
      error = String(e && e.message ? e.message : e);
    }
  }

  const status = await getTokenStatus().catch(() => ({ connected: false }));

  return (
    <div className="py-12 max-w-lg mx-auto" dir="ltr">
      <h1 className="font-black text-2xl mb-6">AliExpress Connection</h1>

      {result === "connected" && (
        <div className="bg-souq-green/10 border-2 border-souq-green rounded-2xl p-6 mb-6">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-black text-souq-green">Connected successfully!</p>
          <p className="text-sm text-souq-ink/70 mt-1">Access token stored. You can now import products from the admin panel.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
          <p className="font-black text-red-600 mb-2">Connection failed</p>
          <pre className="text-xs whitespace-pre-wrap text-red-800">{error}</pre>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-souq-goldlight/60 p-6">
        <p className="font-bold mb-2">Status</p>
        {status.connected ? (
          <div className="text-sm space-y-1">
            <p className="font-bold text-souq-green">● Connected</p>
            {status.expiresAt && (
              <p className={status.expired ? "text-red-600 font-bold" : "text-souq-ink/70"}>
                Token {status.expired ? "EXPIRED" : "valid until"}: {status.expiresAt}
              </p>
            )}
            <p className="text-souq-ink/50">Last updated: {status.updatedAt}</p>
          </div>
        ) : (
          <p className="text-sm text-souq-ink/60 font-bold">○ Not connected yet</p>
        )}

        <a
          href={authorizeUrl()}
          className="inline-block mt-5 bg-souq-green text-white font-bold rounded-full px-6 py-2.5"
        >
          {status.connected ? "Re-authorize" : "Connect AliExpress"}
        </a>
      </div>
    </div>
  );
}
