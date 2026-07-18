export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

async function runMigration(key) {
  if (key !== "27c10e014c34cf987e486cb5b533e092") return "UNAUTHORIZED";
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Seller" (
      "id" SERIAL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "businessName" TEXT NOT NULL,
      "ownerName" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "city" TEXT,
      "description" TEXT,
      "licenseInfo" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "rejectionNote" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sellerId" INTEGER`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stockQty" INTEGER`);
    return "MIGRATION_OK seller tables ready";
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
