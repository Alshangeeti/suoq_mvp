export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";
import { autoPurchase } from "../../../lib/autofulfill";

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

  let order = null;
  if (phoneMatch) {
    // Phone present in the SMS: require an exact phone+amount match.
    // Guessing by amount alone here could mark the wrong customer's order
    // paid — if nothing matches, leave it for manual admin review.
    order = await prisma.order.findFirst({
      where: { status: "PENDING_PAYMENT", totalMru: amount, phone: phoneMatch[1] },
      orderBy: { createdAt: "asc" }
    });
    if (!order) {
      return NextResponse.json({
        matched: false,
        reason: "phone_amount_mismatch_needs_manual_review",
        amount,
        phone: phoneMatch[1]
      });
    }
  } else {
    // No phone in the SMS: amount-only matching is only safe when there is
    // exactly one pending order with this amount.
    const candidates = await prisma.order.findMany({
      where: { status: "PENDING_PAYMENT", totalMru: amount },
      orderBy: { createdAt: "asc" },
      take: 2
    });
    if (candidates.length !== 1) {
      return NextResponse.json({
        matched: false,
        reason: candidates.length === 0 ? "no_pending_order" : "ambiguous_amount_needs_manual_review",
        amount
      });
    }
    order = candidates[0];
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID", paidAt: new Date() }
  });
  autoPurchase(order.ref).catch(() => {});
  return NextResponse.json({ matched: true, ref: order.ref, amount });
}
