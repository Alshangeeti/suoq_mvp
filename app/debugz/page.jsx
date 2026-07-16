export const dynamic = "force-dynamic";
import { prisma } from "../../lib/db";

export const metadata = { title: "Debug Status" };

export default async function DebugPage() {
  let status = "unknown";
  let detail = "";
  try {
    const count = await prisma.product.count();
    status = "OK";
    detail = `product count: ${count}, DATABASE_URL present: ${!!process.env.DATABASE_URL}`;
  } catch (e) {
    status = "ERROR";
    detail = String(e && e.message ? e.message : e);
  }
  return (
    <div>
      <h1>{status}</h1>
      <pre>{detail}</pre>
    </div>
  );
}
