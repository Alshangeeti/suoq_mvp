export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const order = await prisma.order.findUnique({ where: { ref: params.ref } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    order: { ref: order.ref, status: order.status, totalMru: order.totalMru },
    merchantCode: process.env.BANKILY_MERCHANT_CODE || "00000"
  });
}

export async function PATCH(req, { params }) {
  const key = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const order = await prisma.order.update({
    where: { ref: params.ref },
    data: { status: "PAID", paidAt: new Date() }
  });
  return NextResponse.json({ ok: true, ref: order.ref });
}
