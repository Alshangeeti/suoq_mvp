const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

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

async function main() {
  await db.order.deleteMany();
  await db.product.deleteMany();
  for (const p of products) await db.product.create({ data: p });
  console.log("Seeded", products.length, "products");
}
main().finally(() => db.$disconnect());
