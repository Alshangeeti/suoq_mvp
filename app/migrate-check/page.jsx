export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

async function runMigration(key) {
  if (key !== "6b275b4a22ed09f7057f52945c77dad6") return "UNAUTHORIZED";
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT`);
    return "MIGRATION_OK passwordHash column ready";
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
