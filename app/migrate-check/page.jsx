export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";
import { DEFAULT_TREE } from "../../lib/categories";

async function runMigration(key) {
  if (key !== "f33bca89281dae1d17480f6a15574152") return "UNAUTHORIZED";
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Category" (
      "id" SERIAL PRIMARY KEY,
      "slug" TEXT NOT NULL UNIQUE,
      "ar" TEXT NOT NULL,
      "fr" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Subcategory" (
      "id" SERIAL PRIMARY KEY,
      "slug" TEXT NOT NULL UNIQUE,
      "ar" TEXT NOT NULL,
      "fr" TEXT NOT NULL,
      "categoryId" INTEGER NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE
    )`);

    const count = await prisma.category.count();
    let seeded = 0;
    if (count === 0) {
      for (let i = 0; i < DEFAULT_TREE.length; i++) {
        const c = DEFAULT_TREE[i];
        const cat = await prisma.category.create({
          data: { slug: c.slug, ar: c.ar, fr: c.fr, order: i }
        });
        for (const s of c.subs) {
          await prisma.subcategory.create({
            data: { slug: s.slug, ar: s.ar, fr: s.fr, categoryId: cat.id }
          });
        }
        seeded++;
      }
    }
    return `MIGRATION_OK categories tables ready, seeded=${seeded}`;
  } catch (e) {
    return "MIGRATION_ERROR " + String(e && e.message ? e.message : e).slice(0, 150);
  }
}

export async function generateMetadata({ searchParams }) {
  const result = await runMigration(searchParams?.key);
  return { title: result };
}

export default function MigrateCheck() {
  return <div className="py-10 font-bold">See page title for result.</div>;
}
