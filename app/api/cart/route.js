export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";
import { getSessionCustomer } from "../../../lib/session";

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
  const raw = Array.isArray(body.cart) ? body.cart : [];
  // Validate shape and cap size so the account cart can't be abused as
  // arbitrary JSON storage.
  const cart = raw.slice(0, 50).flatMap((i) => {
    const id = parseInt(i && i.id, 10);
    const qty = parseInt(i && i.qty, 10);
    const priceMru = parseInt(i && i.priceMru, 10);
    if (Number.isNaN(id) || Number.isNaN(qty) || qty < 1 || qty > 99) return [];
    const skuAttr = typeof i.skuAttr === "string" ? i.skuAttr.slice(0, 300) : null;
    return [{
      id,
      qty,
      key: `${id}|${skuAttr || ""}`,
      priceMru: Number.isNaN(priceMru) ? 0 : priceMru,
      nameAr: String(i.nameAr || "").slice(0, 200),
      nameFr: String(i.nameFr || "").slice(0, 200),
      emoji: String(i.emoji || "").slice(0, 8),
      imageUrl: typeof i.imageUrl === "string" && i.imageUrl.startsWith("http") ? i.imageUrl.slice(0, 500) : null,
      skuAttr,
      variantLabel: typeof i.variantLabel === "string" ? i.variantLabel.slice(0, 120) : null
    }];
  });
  await prisma.customer.update({
    where: { id: customer.id },
    data: { cartJson: JSON.stringify(cart) }
  });
  return NextResponse.json({ ok: true });
}
