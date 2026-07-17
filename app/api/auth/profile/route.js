export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { getSessionCustomer } from "../../../../lib/session";
import { isValidEmail } from "../../../../lib/email";

export async function PATCH(req) {
  const me = await getSessionCustomer(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.gender === "male" || body.gender === "female") data.gender = body.gender;
  if (body.age !== undefined && body.age !== null && body.age !== "") {
    const age = parseInt(body.age, 10);
    if (!Number.isNaN(age) && age > 0 && age < 120) data.age = age;
  }

  if (body.email !== undefined) {
    const email = String(body.email || "").trim().toLowerCase();
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (email) data.email = email;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  let customer;
  try {
    customer = await prisma.customer.update({ where: { id: me.id }, data });
  } catch (e) {
    if (e && e.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({
    ok: true,
    customer: {
      phone: customer.phone,
      email: customer.email,
      name: customer.name,
      gender: customer.gender,
      age: customer.age
    }
  });
}
