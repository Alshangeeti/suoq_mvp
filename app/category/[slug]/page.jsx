export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { notFound } from "next/navigation";
import { findCategory } from "../../../lib/categories";
import CategoryClient from "../../../components/CategoryClient";

export default async function CategoryPage({ params }) {
  const cat = findCategory(params.slug);
  if (!cat) notFound();

  const [products, images] = await Promise.all([
    prisma.product.findMany({ where: { category: cat.slug }, orderBy: { id: "desc" } }),
    prisma.categoryImage.findMany({
      where: { slug: { in: cat.subs.map((s) => s.slug) } }
    })
  ]);

  const imageMap = {};
  for (const img of images) imageMap[img.slug] = img.imageUrl;

  return <CategoryClient cat={cat} products={products} imageMap={imageMap} />;
}

export async function generateMetadata({ params }) {
  const cat = findCategory(params.slug);
  if (!cat) return {};
  return { title: `${cat.ar} · ${cat.fr}` };
}
