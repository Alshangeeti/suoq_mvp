export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { getSessionCustomer } from "../../../../lib/session";

export async function GET(req) {
  const customer = await getSessionCustomer(req);
  if (!customer) return NextResponse.json({ customer: null });

  // Claim any guest orders with this account's phone, then list by account —
  // order history belongs to the account, not to the phone string.
  if (customer.phone) {
    await prisma.order.updateMany({
      where: { phone: customer.phone, customerId: null },
      data: { customerId: customer.id }
    }).catch(() => {});
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    customer: {
      phone: customer.phone,
      email: customer.email,
      name: customer.name,
      gender: customer.gender,
      age: customer.age
    },
    orders
  });
}
