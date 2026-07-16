export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";

const CATEGORIES = ["electronics", "home", "fashion", "beauty"];

function cleanProduct(body) {
  const nameAr = String(body.nameAr || "").trim().slice(0, 200);
  const nameFr = String(body.nameFr || "").trim().slice(0, 200);
  const descAr = String(body.descAr || "").trim().slice(0, 500);
  const descFr = String(body.descFr || "").trim().slice(0, 500);
  const priceMru = parseInt(body.priceMru, 10);
  const category = CATEGORIES.includes(body.category) ? body.category : "home";
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
  const costUsd = body.costUsd !== undefined && body.costUsd !== null && body.costUsd !== ""
    ? parseFloat(body.costUsd)
    : null;
  if (!nameAr || !nameFr || Number.isNaN(priceMru) || priceMru <= 0) return null;
  return {
    nameAr, nameFr, descAr, descFr, priceMru, category, emoji, stocked,
    imageUrl, imagesJson, aliexpressId, skuAttr,
    costUsd: costUsd !== null && !Number.isNaN(costUsd) ? costUsd : null
  };
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const data = cleanProduct(body);
  if (!data) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const product = await prisma.product.create({ data });
  return NextResponse.json({ ok: true, product });
}

export async function PUT(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = parseInt(body.id, 10);
  const data = cleanProduct(body);
  if (Number.isNaN(id) || !data) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const product = await prisma.product.update({ where: { id }, data });
  return NextResponse.json({ ok: true, product });
}

export async function DELETE(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = parseInt(body.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
