export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { verifySessionToken } from "../../../../lib/auth";

export async function PATCH(req) {
  const token = req.cookies.get("souq_session")?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const gender = body.gender === "male" || body.gender === "female" ? body.gender : null;
  if (!gender) return NextResponse.json({ error: "Invalid gender" }, { status: 400 });

  const customer = await prisma.customer.update({
    where: { phone: session.phone },
    data: { gender }
  });

  return NextResponse.json({ ok: true, customer: { phone: customer.phone, gender: customer.gender } });
}
