export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";
import { getSessionCustomer } from "../../../lib/session";

function parseAddresses(customer) {
  try {
    return JSON.parse(customer.addressesJson || "[]");
  } catch {
    return [];
  }
}

export async function GET(req) {
  const customer = await getSessionCustomer(req);
  if (!customer) return NextResponse.json({ addresses: [] });
  return NextResponse.json({ addresses: parseAddresses(customer) });
}

export async function POST(req) {
  const customer = await getSessionCustomer(req);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const city = String(body.city || "").trim();
  const address = String(body.address || "").trim();
  if (!city || !address) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const addresses = parseAddresses(customer);
  const exists = addresses.some((a) => a.city === city && a.address === address);
  if (!exists) {
    addresses.unshift({ id: Date.now(), city, address });
    await prisma.customer.update({
      where: { id: customer.id },
      data: { addressesJson: JSON.stringify(addresses.slice(0, 10)) }
    });
  }
  return NextResponse.json({ addresses: addresses.slice(0, 10) });
}

export async function DELETE(req) {
  const customer = await getSessionCustomer(req);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const addresses = parseAddresses(customer).filter((a) => a.id !== body.id);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { addressesJson: JSON.stringify(addresses) }
  });
  return NextResponse.json({ addresses });
}
