export const dynamic = "force-dynamic";
import { prisma } from "../lib/db";
import HomeClient from "../components/HomeClient";
import { getCategoryTree } from "../lib/categories";

// Server-rendered homepage: products arrive in the initial HTML (faster
// first paint, crawlable content) instead of a client-side fetch.
export default async function Home({ searchParams }) {
  let products = [];
  let tree = [];
  let loadError = false;
  try {
    products = await prisma.product.findMany({ orderBy: { id: "asc" } });
    tree = await getCategoryTree();
  } catch (e) {
    console.error("Home products load failed:", e);
    loadError = true;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
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
        products={products}
        tree={tree}
        loadError={loadError}
        initialCat={searchParams?.cat || "all"}
        initialSub={searchParams?.sub || ""}
        initialQuery={searchParams?.q || ""}
      />
    </>
  );
}
