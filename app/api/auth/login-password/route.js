export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { createSessionToken } from "../../../../lib/auth";
import { verifyPassword } from "../../../../lib/password";
import { normalizePhone } from "../../../../lib/phone";
import { isValidEmail } from "../../../../lib/email";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  if (!password) return NextResponse.json({ error: "Missing password" }, { status: 400 });

  let customer = null;
  if (body.email) {
    const email = String(body.email).trim().toLowerCase();
    if (!isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    customer = await prisma.customer.findUnique({ where: { email } });
  } else {
    const phone = normalizePhone(body.phone, body.dialCode);
    if (!phone) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    customer = await prisma.customer.findUnique({ where: { phone } });
  }

  if (!customer || !customer.passwordHash) {
    // Same message for "no account" and "no password set" to avoid leaking
    // which identifiers exist. UI suggests code login as the fallback.
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }
  if (!verifyPassword(password, customer.passwordHash)) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const token = createSessionToken("id:" + customer.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("souq_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });
  return res;
}
