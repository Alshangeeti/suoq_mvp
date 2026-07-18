export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";
import { getSessionCustomer } from "../../../lib/session";
import { normalizePhone } from "../../../lib/phone";
import { isAdmin } from "../../../lib/adminAuth";
import { METHOD_IDS, methodMode } from "../../../lib/payments";
import { autoPurchase } from "../../../lib/autofulfill";

// Order numbers: LO (local — every item from a local seller) or GO (global —
// anything sourced from China, or mixed), + year + sequence starting at 01.
// Example: LO202601, GO202614.
async function makeRef(items, dbProducts, attempt) {
  const allLocal =
    items.length > 0 &&
    items.every((i) => {
      const p = dbProducts.find((d) => d.id === i.id);
      return p && p.sellerId !== null && p.sellerId !== undefined;
    });
  const prefix = (allLocal ? "LO" : "GO") + new Date().getFullYear();
  const count = await prisma.order.count({ where: { ref: { startsWith: prefix } } });
  const seq = count + 1 + attempt;
  return prefix + String(seq).padStart(2, "0");
}

export async function POST(req) {
  const body = await req.json();
  const { customerName, phone, city, address, items } = body;
  if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const paymentMethod = METHOD_IDS.includes(body.paymentMethod) ? body.paymentMethod : "BANKILY";
  // COD orders are confirmed immediately (payment is collected at delivery).
  const initialStatus = methodMode(paymentMethod) === "cod" ? "COD" : "PENDING_PAYMENT";
  const ids = items.map((i) => i.id);
  const dbProducts = await prisma.product.findMany({ where: { id: { in: ids } } });
  const total = items.reduce((sum, i) => {
    const p = dbProducts.find((d) => d.id === i.id);
    return sum + (p ? p.priceMru * Math.max(1, i.qty | 0) : 0);
  }, 0);
  if (total <= 0) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

  // Inventory-tracked products (local sellers): block overselling.
  for (const i of items) {
    const p = dbProducts.find((d) => d.id === i.id);
    if (p && p.stockQty !== null && p.stockQty !== undefined && p.stockQty < Math.max(1, i.qty | 0)) {
      return NextResponse.json({ error: "OUT_OF_STOCK", productId: p.id }, { status: 409 });
    }
  }

  const normalizedPhone = normalizePhone(phone);

  // Orders belong to the logged-in ACCOUNT regardless of which phone number
  // was typed at checkout — history survives phone changes.
  let customerId = null;
  const sessionCustomer = await getSessionCustomer(req);
  if (sessionCustomer) customerId = sessionCustomer.id;

  // Retry on the (rare) random ref collision instead of surfacing a 500
  // to the customer at the moment they're trying to pay.
  let order = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await prisma.order.create({
        data: {
          ref: await makeRef(items, dbProducts, attempt),
          customerName,
          phone: normalizedPhone,
          city: city || "Nouakchott",
          address,
          totalMru: total,
          status: initialStatus,
          paymentMethod,
          itemsJson: JSON.stringify(items),
          ...(customerId ? { customerId } : {})
        }
      });
    } catch (e) {
      if (e && e.code === "P2002") continue; // unique ref collision — retry
      throw e;
    }
  }
  if (!order) return NextResponse.json({ error: "Please try again" }, { status: 500 });

  // Decrement tracked stock (guarded against races going negative).
  for (const i of items) {
    const p = dbProducts.find((d) => d.id === i.id);
    if (p && p.stockQty !== null && p.stockQty !== undefined) {
      await prisma.product.updateMany({
        where: { id: p.id, stockQty: { gte: Math.max(1, i.qty | 0) } },
        data: { stockQty: { decrement: Math.max(1, i.qty | 0) } }
      }).catch(() => {});
    }
  }
  if (initialStatus === "COD") {
    autoPurchase(order.ref).catch(() => {});
  }
  return NextResponse.json({ ref: order.ref });
}

export async function GET(req) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders);
}
