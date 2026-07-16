export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

async function runMigration(key) {
  if (key !== "df1fb472e403acad2f38e612ca001aa6") return "UNAUTHORIZED";
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AppToken" (
      "id" SERIAL PRIMARY KEY,
      "provider" TEXT NOT NULL UNIQUE,
      "accessToken" TEXT NOT NULL,
      "refreshToken" TEXT,
      "expiresAt" TIMESTAMP(3),
      "rawJson" TEXT NOT NULL DEFAULT '{}',
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    return "MIGRATION_OK AppToken table ready";
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
