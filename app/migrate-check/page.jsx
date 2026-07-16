export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

export const metadata = { title: "Migrate Check" };

export default async function MigrateCheck({ searchParams }) {
  if (searchParams?.key !== "8cb302b4aa4646d05e01f34c83b24536") {
    return <div><h1>Unauthorized</h1></div>;
  }
  let result = "";
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'BANKILY'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentRef" TEXT`);
    const count = await prisma.order.count();
    result = `OK — paymentMethod + paymentRef columns ensured. Orders in DB: ${count}`;
  } catch (e) {
    result = "ERROR: " + String(e && e.message ? e.message : e);
  }
  return (
    <div className="py-10">
      <h1 className="font-black text-xl">Migration result</h1>
      <pre className="mt-4 whitespace-pre-wrap">{result}</pre>
    </div>
  );
}
