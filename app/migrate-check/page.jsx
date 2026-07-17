export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

async function runMigration(key) {
  if (key !== "19dda0fad0039d2d7795c6794608f710") return "UNAUTHORIZED";
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subcategory" TEXT`);
    return "MIGRATION_OK subcategory column ready";
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
