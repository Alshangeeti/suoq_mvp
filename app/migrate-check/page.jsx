export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

async function runMigration(key) {
  if (key !== "b624e5ec535710ca59a9b84569228921") return "UNAUTHORIZED";
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "email" TEXT`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email")`);
    return "MIGRATION_OK email login columns ready";
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
