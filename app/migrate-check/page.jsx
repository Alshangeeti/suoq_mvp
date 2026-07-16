export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

async function runMigration(key) {
  if (key !== "2b9cbbe65e8f0f6b17c48bdf0ab1eee1") return "UNAUTHORIZED";
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "rejectionNote" TEXT`);
    return "MIGRATION_OK rejection columns added";
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
