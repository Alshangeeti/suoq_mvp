export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";

const FULFILLMENT_STATUSES = ["RECEIVED", "IN_PROGRESS", "SHIPPED", "DELIVERED"];

export async function GET(req, { params }) {
  const order = await prisma.order.findUnique({ where: { ref: params.ref } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    order: {
      ref: order.ref,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      totalMru: order.totalMru
    },
    merchantCode: process.env.BANKILY_MERCHANT_CODE || "00000"
  });
}

export async function PATCH(req, { params }) {
  const key = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const data = {};

  if (body.action === "markPaid") {
    data.status = "PAID";
    data.paidAt = new Date();
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
