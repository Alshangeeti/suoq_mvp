export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { verifySessionToken } from "../../../../lib/auth";

export async function PATCH(req) {
  const token = req.cookies.get("souq_session")?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.gender === "male" || body.gender === "female") data.gender = body.gender;
  if (body.age !== undefined && body.age !== null && body.age !== "") {
    const age = parseInt(body.age, 10);
    if (!Number.isNaN(age) && age > 0 && age < 120) data.age = age;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { phone: session.phone },
    data
  });

  return NextResponse.json({
    ok: true,
    customer: {
      phone: customer.phone,
      name: customer.name,
      gender: customer.gender,
      age: customer.age
    }
  });
}
