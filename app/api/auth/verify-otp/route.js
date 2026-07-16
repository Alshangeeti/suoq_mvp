export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { createSessionToken } from "../../../../lib/auth";
import { normalizePhone, hashOtp } from "../../../../lib/phone";

const MAX_ATTEMPTS = 5;

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const normalized = normalizePhone(body.phone, body.dialCode);
  const code = String(body.code || "");
  if (!normalized || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Take the newest live code for this phone and count attempts against it,
  // so a 6-digit code can't be brute-forced within its 5-minute window.
  const otp = await prisma.otpCode.findFirst({
    where: { phone: normalized, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" }
  });
  if (!otp || otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  if (otp.code !== hashOtp(code)) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } }
    });
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

  let customer = await prisma.customer.findUnique({ where: { phone: normalized } });
  if (!customer) {
    customer = await prisma.customer.create({ data: { phone: normalized, verified: true } });
  } else if (!customer.verified) {
    customer = await prisma.customer.update({ where: { id: customer.id }, data: { verified: true } });
  }

  const token = createSessionToken(normalized);
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
