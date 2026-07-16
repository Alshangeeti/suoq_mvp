export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { notFound } from "next/navigation";
import ProductDetailClient from "../../../components/ProductDetailClient";

export default async function ProductPage({ params }) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) notFound();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { category: product.category, id: { not: id } },
    take: 4
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameFr,
    description: product.descFr,
    offers: {
      "@type": "Offer",
      priceCurrency: "MRU",
      price: product.priceMru,
      availability: product.stocked ? "https://schema.org/InStock" : "https://schema.org/PreOrder"
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}

export async function generateMetadata({ params }) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return {};
  const p = await prisma.product.findUnique({ where: { id } }).catch(() => null);
  if (!p) return {};
  return {
    title: `${p.nameAr} · ${p.nameFr}`,
    description: p.descFr,
    openGraph: { title: p.nameFr, description: p.descFr }
  };
}
