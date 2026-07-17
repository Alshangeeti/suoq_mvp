export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { notFound } from "next/navigation";
import { findCategoryDb } from "../../../lib/categories";
import CategoryClient from "../../../components/CategoryClient";

const PAGE_SIZE = 24;

export default async function CategoryPage({ params }) {
  const cat = await findCategoryDb(params.slug);
  if (!cat) notFound();

  const [total, items, images] = await Promise.all([
    prisma.product.count({ where: { category: cat.slug } }),
    prisma.product.findMany({
      where: { category: cat.slug },
      orderBy: { id: "desc" },
      take: PAGE_SIZE
    }),
    prisma.categoryImage.findMany({
      where: { slug: { in: cat.subs.map((s) => s.slug) } }
    })
  ]);

  const imageMap = {};
  for (const img of images) imageMap[img.slug] = img.imageUrl;

  return <CategoryClient cat={cat} imageMap={imageMap} initialItems={items} initialTotal={total} />;
}

export async function generateMetadata({ params }) {
  const cat = await findCategoryDb(params.slug);
  if (!cat) return {};
  return { title: `${cat.ar} · ${cat.fr}` };
}
