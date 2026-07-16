export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";

const SETUP_SECRET = "ee1aa66e0c548cff189601edb96f261a";

const products = [
  { nameAr: "سماعات بلوتوث لاسلكية", nameFr: "Écouteurs Bluetooth sans fil", descAr: "صوت نقي، بطارية 24 ساعة، مقاومة للماء", descFr: "Son clair, batterie 24h, résistant à l'eau", priceMru: 850, category: "electronics", emoji: "🎧", stocked: true },
  { nameAr: "ساعة ذكية رياضية", nameFr: "Montre connectée sport", descAr: "قياس نبض القلب، إشعارات، شاشة لمس", descFr: "Cardio, notifications, écran tactile", priceMru: 1450, category: "electronics", emoji: "⌚", stocked: true },
  { nameAr: "خلاط كهربائي محمول", nameFr: "Mixeur portable rechargeable", descAr: "يشحن بالـ USB، مثالي للعصائر", descFr: "Recharge USB, idéal pour les jus", priceMru: 680, category: "home", emoji: "🥤", stocked: true },
  { nameAr: "طقم أواني طبخ 12 قطعة", nameFr: "Batterie de cuisine 12 pièces", descAr: "جرانيت عالي الجودة، لا يلتصق", descFr: "Granite haute qualité, anti-adhésif", priceMru: 4200, category: "home", emoji: "🍳", stocked: false },
  { nameAr: "عباءة نسائية مطرزة", nameFr: "Abaya brodée", descAr: "قماش فاخر، تطريز يدوي أنيق", descFr: "Tissu premium, broderie élégante", priceMru: 2100, category: "fashion", emoji: "🧕", stocked: false },
  { nameAr: "حقيبة ظهر عصرية", nameFr: "Sac à dos moderne", descAr: "مقاومة للماء، منفذ USB، حجم كبير", descFr: "Imperméable, port USB, grande capacité", priceMru: 950, category: "fashion", emoji: "🎒", stocked: true },
  { nameAr: "مجفف شعر احترافي", nameFr: "Sèche-cheveux professionnel", descAr: "قوة 2000 واط، 3 سرعات", descFr: "2000W, 3 vitesses", priceMru: 1200, category: "beauty", emoji: "💇", stocked: false },
  { nameAr: "مصباح مكتب LED", nameFr: "Lampe de bureau LED", descAr: "3 درجات إضاءة، ذراع قابل للطي", descFr: "3 intensités, bras pliable", priceMru: 540, category: "home", emoji: "💡", stocked: true }
];

export async function GET(req) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Product" (
      "id" SERIAL PRIMARY KEY,
      "nameAr" TEXT NOT NULL,
      "nameFr" TEXT NOT NULL,
      "descAr" TEXT NOT NULL,
      "descFr" TEXT NOT NULL,
      "priceMru" INTEGER NOT NULL,
      "category" TEXT NOT NULL,
      "emoji" TEXT NOT NULL,
      "stocked" BOOLEAN NOT NULL DEFAULT false
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Order" (
      "id" SERIAL PRIMARY KEY,
      "ref" TEXT NOT NULL UNIQUE,
      "customerName" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "address" TEXT NOT NULL,
      "totalMru" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
      "itemsJson" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "paidAt" TIMESTAMP(3)
    )`);
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    for (const p of products) await prisma.product.create({ data: p });
    const count = await prisma.product.count();
    return new NextResponse(
      `<html><body><h1>OK</h1><p>seeded: ${products.length}</p><p>count: ${count}</p></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    return new NextResponse(
      `<html><body><h1>ERROR</h1><pre>${msg.replace(/</g, "&lt;")}</pre></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
