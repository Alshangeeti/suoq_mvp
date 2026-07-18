export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { getSessionSeller } from "../../../../lib/sellerAuth";

async function approvedSeller(req) {
  const seller = await getSessionSeller(req);
  if (!seller || seller.status !== "APPROVED") return null;
  return seller;
}

function cleanSellerProduct(body) {
  const nameAr = String(body.nameAr || "").trim().slice(0, 200);
  const nameFr = String(body.nameFr || "").trim().slice(0, 200);
  const descAr = String(body.descAr || "").trim().slice(0, 500) || nameAr;
  const descFr = String(body.descFr || "").trim().slice(0, 500) || nameFr;
  const priceMru = parseInt(body.priceMru, 10);
  const stockQty = body.stockQty === "" || body.stockQty === null || body.stockQty === undefined
    ? 0
    : Math.max(0, parseInt(body.stockQty, 10) || 0);
  const imageUrl = typeof body.imageUrl === "string" && (body.imageUrl.startsWith("http") || body.imageUrl.startsWith("data:image/"))
    ? body.imageUrl.slice(0, 300000)
    : null;
  if (!nameAr || !nameFr || Number.isNaN(priceMru) || priceMru <= 0) return null;
  return { nameAr, nameFr, descAr, descFr, priceMru, stockQty, imageUrl };
}

export async function GET(req) {
  const seller = await getSessionSeller(req);
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    orderBy: { id: "desc" }
  });
  return NextResponse.json({ products });
}

export async function POST(req) {
  const seller = await approvedSeller(req);
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const data = cleanSellerProduct(body);
  if (!data) return NextResponse.json({ error: "أكمل الاسم والسعر" }, { status: 400 });

  const category = String(body.category || "");
  const cat = await prisma.category.findUnique({ where: { slug: category } });
  let subcategory = null;
  if (body.subcategory) {
    const sub = await prisma.subcategory.findUnique({ where: { slug: String(body.subcategory) }, include: { category: true } });
    if (sub && cat && sub.category.slug === cat.slug) subcategory = sub.slug;
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      category: cat ? cat.slug : "home",
      subcategory,
      emoji: "🏪",
      stocked: true, // local seller stock = fast local delivery
      sellerId: seller.id,
      imagesJson: data.imageUrl ? JSON.stringify([data.imageUrl]) : "[]"
    }
  });
  return NextResponse.json({ ok: true, product });
}

export async function PUT(req) {
  const seller = await approvedSeller(req);
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = parseInt(body.id, 10);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.sellerId !== seller.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const data = cleanSellerProduct(body);
  if (!data) return NextResponse.json({ error: "أكمل الاسم والسعر" }, { status: 400 });
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      imagesJson: data.imageUrl ? JSON.stringify([data.imageUrl]) : existing.imagesJson
    }
  });
  return NextResponse.json({ ok: true, product });
}

export async function DELETE(req) {
  const seller = await getSessionSeller(req);
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = parseInt(body.id, 10);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.sellerId !== seller.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
