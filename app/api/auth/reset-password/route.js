export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { createSessionToken } from "../../../../lib/auth";
import { hashPassword } from "../../../../lib/password";
import { normalizePhone, hashOtp } from "../../../../lib/phone";
import { isValidEmail } from "../../../../lib/email";

const MAX_ATTEMPTS = 5;

// Forgot password: the customer requests a code via /api/auth/request-otp,
// then submits identifier + code + new password here.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "");
  const newPassword = String(body.newPassword || "");
  if (!code || newPassword.length < 6) {
    return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
  }

  let identifier = null;
  let where = null;
  if (body.email) {
    const email = String(body.email).trim().toLowerCase();
    if (!isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    identifier = email;
    where = { email };
  } else {
    const phone = normalizePhone(body.phone, body.dialCode);
    if (!phone) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    identifier = phone;
    where = { phone };
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone: identifier, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" }
  });
  if (!otp || otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }
  if (otp.code !== hashOtp(code)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

  let customer = await prisma.customer.findUnique({ where });
  if (!customer) {
    // The code proves they own the identifier — create the account.
    customer = await prisma.customer.create({ data: { ...where, verified: true } });
  }
  customer = await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash: hashPassword(newPassword), verified: true }
  });

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
