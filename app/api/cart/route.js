export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";
import { verifySessionToken } from "../../../lib/auth";

async function getSessionCustomer(req) {
  const token = req.cookies.get("souq_session")?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) return null;
  return prisma.customer.findUnique({ where: { phone: session.phone } });
}

export async function GET(req) {
  const customer = await getSessionCustomer(req);
  if (!customer) return NextResponse.json({ customer: null, cart: [] });
  let cart = [];
  try {
    cart = JSON.parse(customer.cartJson || "[]");
  } catch {}
  return NextResponse.json({ customer: { phone: customer.phone, gender: customer.gender }, cart });
}

export async function PUT(req) {
  const customer = await getSessionCustomer(req);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const cart = Array.isArray(body.cart) ? body.cart : [];
  await prisma.customer.update({
    where: { id: customer.id },
    data: { cartJson: JSON.stringify(cart) }
  });
  return NextResponse.json({ ok: true });
}
