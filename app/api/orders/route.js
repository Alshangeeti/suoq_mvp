export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";

function makeRef() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "SM-" + s;
}

export async function POST(req) {
  const body = await req.json();
  const { customerName, phone, city, address, items } = body;
  if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const ids = items.map((i) => i.id);
  const dbProducts = await prisma.product.findMany({ where: { id: { in: ids } } });
  const total = items.reduce((sum, i) => {
    const p = dbProducts.find((d) => d.id === i.id);
    return sum + (p ? p.priceMru * Math.max(1, i.qty | 0) : 0);
  }, 0);
  if (total <= 0) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

  const normalizedPhone = String(phone).replace(/\D/g, "").slice(-8);
  const order = await prisma.order.create({
    data: {
      ref: makeRef(),
      customerName,
      phone: normalizedPhone,
      city: city || "Nouakchott",
      address,
      totalMru: total,
      itemsJson: JSON.stringify(items)
    }
  });
  return NextResponse.json({ ref: order.ref });
}

export async function GET(req) {
  const key = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders);
}
