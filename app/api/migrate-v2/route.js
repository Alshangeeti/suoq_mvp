export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";

const SECRET = "65752b0403cfa7555aff74496b88130d";

export async function GET(req) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SECRET) {
    return new NextResponse(
      `<html><head><title>Unauthorized</title></head><body><h1>Unauthorized</h1></body></html>`,
      { status: 401, headers: { "Content-Type": "text/html" } }
    );
  }
  const log = [];
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Customer" (
      "id" SERIAL PRIMARY KEY,
      "phone" TEXT NOT NULL UNIQUE,
      "name" TEXT,
      "verified" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    log.push("Customer table ok");

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "OtpCode" (
      "id" SERIAL PRIMARY KEY,
      "phone" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "used" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    log.push("OtpCode table ok");

    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fulfillmentStatus" TEXT NOT NULL DEFAULT 'RECEIVED'`);
    log.push("fulfillmentStatus column ok");

    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerId" INTEGER`);
    log.push("customerId column ok");

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey"
          FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    log.push("FK constraint ok");

    return new NextResponse(
      `<html><head><title>Migrate OK</title></head><body><h1>OK</h1><pre>${log.join("\n")}</pre></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    return new NextResponse(
      `<html><head><title>Migrate Error</title></head><body><h1>ERROR</h1><pre>${log.join("\n")}\n\n${msg.replace(/</g, "&lt;")}</pre></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
