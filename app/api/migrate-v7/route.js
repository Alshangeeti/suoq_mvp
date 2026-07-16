export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";

const SECRET = "4cc1d66bcf7e2d04685a4f4452453b60";

export async function GET(req) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SECRET) {
    return new NextResponse("<html><head><title>Unauthorized</title></head><body><h1>Unauthorized</h1></body></html>", {
      status: 401, headers: { "Content-Type": "text/html" }
    });
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0`);
    // Old plaintext codes are incompatible with the new hashed scheme — clear them.
    await prisma.$executeRawUnsafe(`DELETE FROM "OtpCode"`);
    return new NextResponse("<html><head><title>Migrate OK</title></head><body><h1>OK</h1><p>attempts column added; old codes cleared</p></body></html>", {
      status: 200, headers: { "Content-Type": "text/html" }
    });
  } catch (e) {
    const msg = String(e && e.message ? e.message : e).replace(/</g, "&lt;");
    return new NextResponse(`<html><head><title>Migrate Error</title></head><body><h1>ERROR</h1><pre>${msg}</pre></body></html>`, {
      status: 500, headers: { "Content-Type": "text/html" }
    });
  }
}
