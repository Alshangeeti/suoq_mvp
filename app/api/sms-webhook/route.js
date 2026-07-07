export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";

// Receives POSTs from the Android SMS gateway app at the Nouakchott office.
// Expected JSON body: { "message": "<full SMS text>", "secret": "<shared secret>" }
// Parses the Bankily payment confirmation SMS for the amount and the payer's
// phone number, then matches the oldest pending order with the same amount
// (and phone, when present in the SMS) and marks it PAID.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const secret = body.secret || req.headers.get("x-webhook-secret");
  if (!process.env.SMS_WEBHOOK_SECRET || secret !== process.env.SMS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const message = String(body.message || "");
  if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

  // Amount: first number followed by MRU/UM/ouguiya variants (handles 1 234,56 / 1234.56 / 1234)
  const amountMatch = message.match(/([\d][\d\s.,]*)\s*(MRU|UM|MRO|ouguiya|أوقية)/i);
  // Payer phone: 8-digit Mauritanian mobile appearing in the SMS
  const phoneMatch = message.match(/\b([234]\d{7})\b/);

  if (!amountMatch) {
    return NextResponse.json({ matched: false, reason: "amount_not_found" });
  }
  const amount = Math.round(parseFloat(amountMatch[1].replace(/\s/g, "").replace(",", ".")));

  const where = { status: "PENDING_PAYMENT", totalMru: amount };
  if (phoneMatch) where.phone = phoneMatch[1];

  let order = await prisma.order.findFirst({ where, orderBy: { createdAt: "asc" } });
  // Fallback: match on amount alone if phone match found nothing
  if (!order && phoneMatch) {
    order = await prisma.order.findFirst({
      where: { status: "PENDING_PAYMENT", totalMru: amount },
      orderBy: { createdAt: "asc" }
    });
  }
  if (!order) return NextResponse.json({ matched: false, reason: "no_pending_order", amount });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID", paidAt: new Date() }
  });
  return NextResponse.json({ matched: true, ref: order.ref, amount });
}
