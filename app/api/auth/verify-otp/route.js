export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { createSessionToken } from "../../../../lib/auth";
import { normalizePhone } from "../../../../lib/phone";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const normalized = normalizePhone(body.phone);
  const code = String(body.code || "");
  if (!normalized || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone: normalized, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" }
  });
  if (!otp) {
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
