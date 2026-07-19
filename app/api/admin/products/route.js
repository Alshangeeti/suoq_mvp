export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";


async function cleanProduct(body) {
  const CATEGORIES = (await prisma.category.findMany({ select: { slug: true } })).map((x) => x.slug);
  const nameAr = String(body.nameAr || "").trim().slice(0, 200);
  const nameFr = String(body.nameFr || "").trim().slice(0, 200);
  const descAr = String(body.descAr || "").trim().slice(0, 500);
  const descFr = String(body.descFr || "").trim().slice(0, 500);
  const priceMru = parseInt(body.priceMru, 10);
  const originalPriceMru = body.originalPriceMru ? parseInt(body.originalPriceMru, 10) : null;
  const category = CATEGORIES.includes(body.category) ? body.category : (CATEGORIES[0] || "home");
  let subcategory = null;
  if (body.subcategory) {
    const sub = await prisma.subcategory.findUnique({
      where: { slug: String(body.subcategory) },
      include: { category: true }
    });
    if (sub && sub.category.slug === category) subcategory = sub.slug;
  }
  const emoji = String(body.emoji || "📦").slice(0, 8);
  const stocked = !!body.stocked;
  const imageUrl = String(body.imageUrl || "").trim().slice(0, 500) || null;
  let imagesJson = "[]";
  if (Array.isArray(body.images)) {
    imagesJson = JSON.stringify(
      body.images.filter((u) => typeof u === "string" && u.startsWith("http")).slice(0, 6)
    );
  }
  const aliexpressId = String(body.aliexpressId || "").trim().slice(0, 30) || null;
  const skuAttr = String(body.skuAttr || "").trim().slice(0, 300) || null;
  let url1688 = String(body.url1688 || "").trim().slice(0, 500) || null;
  if (url1688 && !/1688\.com/.test(url1688)) url1688 = null;
  let variantsJson = "[]";
  if (Array.isArray(body.variants)) {
    variantsJson = JSON.stringify(
      body.variants
        .filter((v) => v && typeof v.attr === "string" && v.attr)
        .slice(0, 30)
        .map((v) => ({
          attr: String(v.attr).slice(0, 300),
          label: String(v.label || "").slice(0, 120),
          price: parseFloat(v.price) || 0,
          image: typeof v.image === "string" && v.image.startsWith("http") ? v.image.slice(0, 500) : null
        }))
    );
  } else if (typeof body.variantsJson === "string") {
    variantsJson = body.variantsJson.slice(0, 20000);
  }
  const costUsd = body.costUsd !== undefined && body.costUsd !== null && body.costUsd !== ""
    ? parseFloat(body.costUsd)
    : null;
  if (!nameAr || !nameFr || Number.isNaN(priceMru) || priceMru <= 0) return null;
  return {
    nameAr, nameFr, descAr, descFr, priceMru,
    originalPriceMru: originalPriceMru && !Number.isNaN(originalPriceMru) && originalPriceMru > priceMru ? originalPriceMru : null,
    category, subcategory, emoji, stocked,
    imageUrl, imagesJson, aliexpressId, url1688, skuAttr, variantsJson,
    costUsd: costUsd !== null && !Number.isNaN(costUsd) ? costUsd : null
  };
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const data = await cleanProduct(body);
  if (!data) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const product = await prisma.product.create({ data });
  return NextResponse.json({ ok: true, product });
}

export async function PUT(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = parseInt(body.id, 10);
  const data = await cleanProduct(body);
  if (Number.isNaN(id) || !data) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const product = await prisma.product.update({ where: { id }, data });
  return NextResponse.json({ ok: true, product });
}

export async function DELETE(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  // Bulk-delete every AliExpress-sourced product (keeps local-seller and
  // manually-added products untouched).
  if (body.action === "deleteAllAe") {
    const result = await prisma.product.deleteMany({
      where: { aliexpressId: { not: null }, sellerId: null }
    });
    return NextResponse.json({ ok: true, deleted: result.count });
  }

  const id = parseInt(body.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
