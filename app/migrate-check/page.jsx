export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

async function runMigration(key) {
  if (key !== "0da85de55a5e8e6de71f32c94205e119") return "UNAUTHORIZED";
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "CategoryImage" (
      "id" SERIAL PRIMARY KEY,
      "slug" TEXT NOT NULL UNIQUE,
      "imageUrl" TEXT NOT NULL
    )`);
    return "MIGRATION_OK CategoryImage table ready";
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
