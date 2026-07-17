export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";


export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.categoryImage.findMany();
  const map = {};
  for (const r of rows) map[r.slug] = r.imageUrl;
  return NextResponse.json({ images: map });
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "");
  // Accepts either a normal https URL or a small data:image/... payload
  // (uploaded from desktop and resized client-side to ~256px).
  const imageUrl = String(body.imageUrl || "").trim().slice(0, 300000);
  const sub = await prisma.subcategory.findUnique({ where: { slug } });
  if (!sub) {
    return NextResponse.json({ error: "Unknown subcategory" }, { status: 400 });
  }
  if (imageUrl && !imageUrl.startsWith("http") && !imageUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Image must be a URL or an uploaded picture" }, { status: 400 });
  }
  if (!imageUrl) {
    await prisma.categoryImage.deleteMany({ where: { slug } });
    return NextResponse.json({ ok: true, removed: true });
  }
  await prisma.categoryImage.upsert({
    where: { slug },
    create: { slug, imageUrl },
    update: { imageUrl }
  });
  return NextResponse.json({ ok: true });
}
