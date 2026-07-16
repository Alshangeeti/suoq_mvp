export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";
import { methodMode } from "../../../../lib/payments";

const FULFILLMENT_STATUSES = ["RECEIVED", "IN_PROGRESS", "SHIPPED", "DELIVERED"];

export async function GET(req, { params }) {
  const order = await prisma.order.findUnique({ where: { ref: params.ref } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    order: {
      ref: order.ref,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentRef: order.paymentRef,
      fulfillmentStatus: order.fulfillmentStatus,
      rejectionReason: order.rejectionReason,
      rejectionNote: order.rejectionNote,
      totalMru: order.totalMru
    },
    payInfo: {
      bankilyMerchantCode: process.env.BANKILY_MERCHANT_CODE || "",
      masrviNumber: process.env.MASRVI_MERCHANT_NUMBER || "",
      sedadNumber: process.env.SEDAD_MERCHANT_NUMBER || "",
      bankDetails: process.env.BANK_TRANSFER_DETAILS || ""
    }
  });
}

// Customer submits a transaction reference for manual payment methods
// (Masrvi / Sedad / bank transfer) — order moves to PENDING_VERIFICATION
// for the admin queue.
export async function POST(req, { params }) {
  const body = await req.json().catch(() => ({}));
  const paymentRef = String(body.paymentRef || "").trim().slice(0, 100);
  if (!paymentRef) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { ref: params.ref } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status !== "PENDING_PAYMENT" || methodMode(order.paymentMethod) !== "manual") {
    return NextResponse.json({ error: "Not applicable" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "PENDING_VERIFICATION", paymentRef }
  });
  return NextResponse.json({ ok: true, status: updated.status });
}

export async function PATCH(req, { params }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const data = {};

  if (body.action === "markPaid" || body.action === "approvePayment") {
    data.status = "PAID";
    data.paidAt = new Date();
  }
  if (body.action === "rejectPayment") {
    data.status = "PENDING_PAYMENT";
  }
  if (body.action === "rejectOrder") {
    const REASONS = ["PAYMENT_NOT_COMPLETED", "DUPLICATE_ORDER"];
    data.status = "REJECTED";
    data.rejectionReason = REASONS.includes(body.reasonCode) ? body.reasonCode : "PAYMENT_NOT_COMPLETED";
    data.rejectionNote = String(body.reasonNote || "").trim().slice(0, 300) || null;
  }
  if (body.action === "unreject") {
    data.status = "PENDING_PAYMENT";
    data.rejectionReason = null;
    data.rejectionNote = null;
  }
  if (body.fulfillmentStatus && FULFILLMENT_STATUSES.includes(body.fulfillmentStatus)) {
    data.fulfillmentStatus = body.fulfillmentStatus;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const order = await prisma.order.update({ where: { ref: params.ref }, data });
  return NextResponse.json({
    ok: true,
    ref: order.ref,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus
  });
}
