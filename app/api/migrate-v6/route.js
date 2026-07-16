export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";

const SECRET = "6148f05121c0850e8b993c0ceee9d68c";

export async function GET(req) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SECRET) {
    return new NextResponse(
      `<html><head><title>Unauthorized</title></head><body><h1>Unauthorized</h1></body></html>`,
      { status: 401, headers: { "Content-Type": "text/html" } }
    );
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "age" INTEGER`);
    return new NextResponse(
      `<html><head><title>Migrate OK</title></head><body><h1>OK</h1><p>age column added</p></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    return new NextResponse(
      `<html><head><title>Migrate Error</title></head><body><h1>ERROR</h1><pre>${msg.replace(/</g, "&lt;")}</pre></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
