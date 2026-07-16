export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { verifySessionToken } from "../../../../lib/auth";

export async function GET(req) {
  const token = req.cookies.get("souq_session")?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ customer: null });

  const customer = await prisma.customer.findUnique({ where: { phone: session.phone } });
  if (!customer) return NextResponse.json({ customer: null });

  const orders = await prisma.order.findMany({
    where: { phone: session.phone },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    customer: { phone: customer.phone, name: customer.name, gender: customer.gender, age: customer.age },
    orders
  });
}
