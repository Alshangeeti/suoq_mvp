export const dynamic = "force-dynamic";
import { prisma } from "../../../lib/db";
import { notFound } from "next/navigation";
import { findCategoryDb, getCategoryTree } from "../../../lib/categories";
import CategoryClient from "../../../components/CategoryClient";

const PAGE_SIZE = 24;

export default async function CategoryPage({ params, searchParams }) {
  const cat = await findCategoryDb(params.slug);
  if (!cat) notFound();

  const initialSub = cat.subs.some((s) => s.slug === searchParams?.sub) ? searchParams.sub : "";
  const where = { category: cat.slug };
  if (initialSub) where.subcategory = initialSub;

  const [total, items, images, tree] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { id: "desc" },
      take: PAGE_SIZE
    }),
    prisma.categoryImage.findMany({
      where: { slug: { in: cat.subs.map((s) => s.slug) } }
    }),
    getCategoryTree()
  ]);

  const imageMap = {};
  for (const img of images) imageMap[img.slug] = img.imageUrl;

  return (
    <CategoryClient
      cat={cat}
      tree={tree}
      imageMap={imageMap}
      initialItems={items}
      initialTotal={total}
      initialSub={initialSub}
    />
  );
}

export async function generateMetadata({ params }) {
  const cat = await findCategoryDb(params.slug);
  if (!cat) return {};
  return { title: `${cat.ar} · ${cat.fr}` };
}
