export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

async function runMigration(key) {
  if (key !== "1941b2eb94a5240cbe49aa72741f332d") return "UNAUTHORIZED";
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originalPriceMru" INTEGER`);
    return "MIGRATION_OK originalPriceMru column ready";
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
