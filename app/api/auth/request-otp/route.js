export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { sendWhatsAppOtp } from "../../../../lib/whatsapp";
import { normalizePhone, hashOtp } from "../../../../lib/phone";

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const normalized = normalizePhone(body.phone, body.dialCode);
  if (!normalized || normalized.length < 8) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  // Housekeeping: drop expired codes so the table doesn't grow forever.
  prisma.otpCode.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

  // Rate limit: max 3 OTP requests per phone per 15 minutes.
  const recent = await prisma.otpCode.count({
    where: { phone: normalized, createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } }
  });
  if (recent >= 3) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const code = genCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await prisma.otpCode.create({ data: { phone: normalized, code: hashOtp(code), expiresAt } });

  const result = await sendWhatsAppOtp(normalized, code);
  if (result.unavailable) {
    return NextResponse.json(
      { error: "Login is temporarily unavailable. Please try later." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    testMode: result.testMode,
    ...(result.testMode ? { devCode: code } : {})
  });
}
