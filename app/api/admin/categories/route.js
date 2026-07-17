export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";
import { slugify } from "../../../../lib/categories";

async function uniqueSlug(base, model) {
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const exists =
      model === "category"
        ? await prisma.category.findUnique({ where: { slug } })
        : await prisma.subcategory.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ar = String(body.ar || "").trim().slice(0, 60);
  const fr = String(body.fr || "").trim().slice(0, 60);
  if (!ar || !fr) return NextResponse.json({ error: "Both names required" }, { status: 400 });

  if (body.action === "addCategory") {
    const slug = await uniqueSlug(slugify(fr), "category");
    const max = await prisma.category.aggregate({ _max: { order: true } });
    const category = await prisma.category.create({
      data: { slug, ar, fr, order: (max._max.order || 0) + 1 }
    });
    return NextResponse.json({ ok: true, category });
  }

  if (body.action === "addSub") {
    const parent = await prisma.category.findUnique({ where: { slug: String(body.categorySlug || "") } });
    if (!parent) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    const slug = await uniqueSlug(slugify(fr), "sub");
    const sub = await prisma.subcategory.create({
      data: { slug, ar, fr, categoryId: parent.id }
    });
    return NextResponse.json({ ok: true, sub });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "");

  if (body.type === "category") {
    const cat = await prisma.category.findUnique({ where: { slug }, include: { subs: true } });
    if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const productCount = await prisma.product.count({ where: { category: slug } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${productCount} product(s) still use this category. Move or delete them first.` },
        { status: 409 }
      );
    }
    const subSlugs = cat.subs.map((s) => s.slug);
    await prisma.category.delete({ where: { id: cat.id } }); // subs cascade
    if (subSlugs.length) {
      await prisma.categoryImage.deleteMany({ where: { slug: { in: subSlugs } } });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.type === "sub") {
    const sub = await prisma.subcategory.findUnique({ where: { slug } });
    if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.subcategory.delete({ where: { id: sub.id } });
    // Products keep working — their subcategory pointer is simply cleared.
    await prisma.product.updateMany({ where: { subcategory: slug }, data: { subcategory: null } });
    await prisma.categoryImage.deleteMany({ where: { slug } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
