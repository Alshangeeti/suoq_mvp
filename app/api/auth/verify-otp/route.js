export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { createSessionToken } from "../../../../lib/auth";
import { normalizePhone, hashOtp } from "../../../../lib/phone";
import { isValidEmail } from "../../../../lib/email";

const MAX_ATTEMPTS = 5;

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "");

  let identifier = null;
  let channel = null;
  if (body.email) {
    const email = String(body.email).trim().toLowerCase();
    if (!isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    identifier = email;
    channel = "email";
  } else {
    identifier = normalizePhone(body.phone, body.dialCode);
    channel = "phone";
  }
  if (!identifier || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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

  let customer;
  if (channel === "email") {
    customer = await prisma.customer.findUnique({ where: { email: identifier } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { email: identifier, verified: true } });
    }
  } else {
    customer = await prisma.customer.findUnique({ where: { phone: identifier } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { phone: identifier, verified: true } });
    }
  }
  if (!customer.verified) {
    customer = await prisma.customer.update({ where: { id: customer.id }, data: { verified: true } });
  }

  // Claim any guest orders placed with this customer's phone number so order
  // history survives even if the phone changes later (orders are linked to
  // the account from here on).
  if (customer.phone) {
    await prisma.order.updateMany({
      where: { phone: customer.phone, customerId: null },
      data: { customerId: customer.id }
    }).catch(() => {});
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
