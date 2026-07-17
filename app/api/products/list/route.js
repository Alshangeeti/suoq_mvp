export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";

const SORTS = {
  newest: { id: "desc" },
  price_asc: { priceMru: "asc" },
  price_desc: { priceMru: "desc" }
};

// The single listing engine behind home, category pages and search:
// server-side filtering + pagination so the site stays fast at 2000+ products.
export async function GET(req) {
  const sp = req.nextUrl.searchParams;
  const cat = sp.get("cat") || "";
  const sub = sp.get("sub") || "";
  const q = (sp.get("q") || "").trim();
  const sort = SORTS[sp.get("sort")] ? sp.get("sort") : "newest";
  const min = parseInt(sp.get("min") || "", 10);
  const max = parseInt(sp.get("max") || "", 10);
  const stocked = sp.get("stocked");
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(sp.get("limit") || "24", 10) || 24));

  const where = {};
  if (cat) where.category = cat;
  if (sub) where.subcategory = sub;
  if (stocked === "1") where.stocked = true;
  if (stocked === "0") where.stocked = false;
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    where.priceMru = {};
    if (!Number.isNaN(min)) where.priceMru.gte = min;
    if (!Number.isNaN(max)) where.priceMru.lte = max;
  }
  if (q) {
    where.OR = [
      { nameAr: { contains: q, mode: "insensitive" } },
      { nameFr: { contains: q, mode: "insensitive" } },
      { descAr: { contains: q, mode: "insensitive" } },
      { descFr: { contains: q, mode: "insensitive" } }
    ];
  }

  try {
    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: SORTS[sort],
        skip: (page - 1) * limit,
        take: limit
      })
    ]);
    return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("product list failed:", e);
    return NextResponse.json({ items: [], total: 0, page: 1, pages: 0, error: true }, { status: 500 });
  }
}
