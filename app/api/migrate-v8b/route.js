export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";

const SECRET = "8cb302b4aa4646d05e01f34c83b24536";

export async function GET(req) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SECRET) {
    return new NextResponse("<html><head><title>Unauthorized</title></head><body><h1>Unauthorized</h1></body></html>", {
      status: 401, headers: { "Content-Type": "text/html" }
    });
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'BANKILY'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentRef" TEXT`);
    return new NextResponse("<html><head><title>Migrate OK</title></head><body><h1>OK</h1><p>paymentMethod + paymentRef added</p></body></html>", {
      status: 200, headers: { "Content-Type": "text/html" }
    });
  } catch (e) {
    const msg = String(e && e.message ? e.message : e).replace(/</g, "&lt;");
    return new NextResponse(`<html><head><title>Migrate Error</title></head><body><h1>ERROR</h1><pre>${msg}</pre></body></html>`, {
      status: 500, headers: { "Content-Type": "text/html" }
    });
  }
}
