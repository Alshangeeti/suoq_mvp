export const dynamic = "force-dynamic";
import { prisma } from "../lib/db";
import { redirect } from "next/navigation";
import HomeClient from "../components/HomeClient";
import { getCategoryTree } from "../lib/categories";

const PAGE_SIZE = 24;

// Server-rendered homepage: first page of products + category tree arrive in
// the initial HTML; further pages/filters go through /api/products/list.
export default async function Home({ searchParams }) {
  const cat = searchParams?.cat || "";
  const sub = searchParams?.sub || "";
  const q = (searchParams?.q || "").trim();

  // Choosing a category now always leads to its dedicated screen.
  if (cat && cat !== "all") {
    redirect(`/category/${cat}${sub ? `?sub=${sub}` : ""}`);
  }

  let items = [];
  let total = 0;
  let tree = [];
  try {
    tree = await getCategoryTree();
    const where = {};
    if (q) {
      where.OR = [
        { nameAr: { contains: q, mode: "insensitive" } },
        { nameFr: { contains: q, mode: "insensitive" } },
        { descAr: { contains: q, mode: "insensitive" } },
        { descFr: { contains: q, mode: "insensitive" } }
      ];
    }
    [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy: { id: "desc" }, take: PAGE_SIZE })
    ]);
  } catch (e) {
    console.error("Home load failed:", e);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.nameFr,
        description: p.descFr,
        offers: {
          "@type": "Offer",
          priceCurrency: "MRU",
          price: p.priceMru,
          availability: p.stocked
            ? "https://schema.org/InStock"
            : "https://schema.org/PreOrder"
        }
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        tree={tree}
        initialItems={items}
        initialTotal={total}
        initialQuery={q}
      />
    </>
  );
}
