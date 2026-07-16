export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { sendWhatsAppOtp } from "../../../../lib/whatsapp";
import { normalizePhone } from "../../../../lib/phone";

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const normalized = normalizePhone(body.phone);
  if (normalized.length < 8) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  const code = genCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await prisma.otpCode.create({ data: { phone: normalized, code, expiresAt } });

  const result = await sendWhatsAppOtp(normalized, code);

  return NextResponse.json({
    ok: true,
    testMode: result.testMode,
    ...(result.testMode ? { devCode: code } : {})
  });
}
