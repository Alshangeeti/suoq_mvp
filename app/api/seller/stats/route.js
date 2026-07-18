export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { getSessionSeller } from "../../../../lib/sellerAuth";

export async function GET(req) {
  const seller = await getSessionSeller(req);
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    select: { id: true, nameFr: true, nameAr: true, stockQty: true }
  });
  const ids = new Set(products.map((p) => p.id));

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      ref: true, status: true, fulfillmentStatus: true, itemsJson: true, createdAt: true,
      customerName: true, phone: true, city: true, address: true
    }
  });

  let soldQty = 0;
  let revenue = 0;
  let pendingQty = 0;
  const sales = [];
  for (const o of orders) {
    let items = [];
    try { items = JSON.parse(o.itemsJson || "[]"); } catch {}
    for (const it of items) {
      if (!ids.has(it.id)) continue;
      const confirmed = o.status === "PAID" || o.status === "COD";
      if (confirmed) {
        soldQty += it.qty;
        revenue += it.priceMru * it.qty;
        if (o.fulfillmentStatus !== "DELIVERED") pendingQty += it.qty;
      }
      if (sales.length < 50) {
        const confirmed2 = o.status === "PAID" || o.status === "COD";
        sales.push({
          ref: o.ref,
          date: o.createdAt,
          name: it.nameAr || it.nameFr,
          variant: it.variantLabel || "",
          qty: it.qty,
          priceMru: it.priceMru,
          emoji: it.emoji,
          nameAr: it.nameAr,
          nameFr: it.nameFr,
          variantLabel: it.variantLabel || null,
          amount: it.priceMru * it.qty,
          status: o.status,
          fulfillment: o.fulfillmentStatus,
          // Customer details only once the order is confirmed (for delivery slips)
          ...(confirmed2
            ? { customerName: o.customerName, phone: o.phone, city: o.city, address: o.address }
            : {})
        });
      }
    }
  }

  const totalStock = products.reduce((s, p) => s + (p.stockQty || 0), 0);
  return NextResponse.json({
    stats: {
      productCount: products.length,
      totalStock,
      soldQty,
      revenue,
      pendingQty
    },
    sales
  });
}
