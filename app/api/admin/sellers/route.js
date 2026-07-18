export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";

export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sellers = await prisma.seller.findMany({ orderBy: { createdAt: "desc" } });
  const counts = await prisma.product.groupBy({
    by: ["sellerId"],
    _count: { id: true },
    where: { sellerId: { not: null } }
  });
  const countMap = {};
  for (const c of counts) countMap[c.sellerId] = c._count.id;
  return NextResponse.json({
    sellers: sellers.map(({ passwordHash, ...s }) => ({ ...s, productCount: countMap[s.id] || 0 }))
  });
}

export async function PATCH(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = parseInt(body.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  if (body.action === "approve") {
    await prisma.seller.update({ where: { id }, data: { status: "APPROVED", rejectionNote: null } });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "reject") {
    await prisma.seller.update({
      where: { id },
      data: { status: "REJECTED", rejectionNote: String(body.note || "").slice(0, 300) || null }
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
