export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";
import { getClient } from "../../../../lib/aliexpress";
import { IMPORT_PLAN } from "../../../../lib/importPlan";
import { slugify } from "../../../../lib/categories";

const RATE = parseFloat(process.env.MRU_PER_USD || "40");
const MARKUP = 1.2;

function firstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}

// Digs through unknown response nesting for the first array of objects that
// look like search-result products.
function findProductArray(obj, depth = 0) {
  if (!obj || depth > 6) return null;
  if (Array.isArray(obj)) {
    if (obj.length && typeof obj[0] === "object" && (obj[0].productId || obj[0].product_id || obj[0].itemId || obj[0].item_id)) {
      return obj;
    }
    return null;
  }
  if (typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      const found = findProductArray(obj[k], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function ensureCategory(entry) {
  const [slug, ar, fr] = entry.cat;
  let cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) {
    const max = await prisma.category.aggregate({ _max: { order: true } });
    cat = await prisma.category.create({ data: { slug, ar, fr, order: (max._max.order || 0) + 1 } });
  }
  let subSlug = null;
  if (entry.sub) {
    const [sSlug, sAr, sFr] = entry.sub;
    let sub = await prisma.subcategory.findUnique({ where: { slug: sSlug } });
    if (!sub) {
      sub = await prisma.subcategory.create({
        data: { slug: sSlug, ar: sAr, fr: sFr, categoryId: cat.id }
      }).catch(() => null);
    }
    if (sub && sub.categoryId === cat.id) subSlug = sub.slug;
    else if (sub) subSlug = null;
  }
  return { catSlug: cat.slug, subSlug };
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const planIndex = parseInt(body.planIndex, 10);
  const page = Math.max(1, parseInt(body.page || "1", 10) || 1);
  const need = Math.min(8, Math.max(1, parseInt(body.need || "8", 10) || 8));
  const entry = IMPORT_PLAN[planIndex];
  if (!entry) return NextResponse.json({ error: "Bad plan index" }, { status: 400 });

  try {
    const { catSlug, subSlug } = await ensureCategory(entry);
    const client = await getClient();

    const searchResp = await client.callAPIDirectly("aliexpress.ds.text.search", {
      keyWord: entry.kw,
      countryCode: "CN",
      currency: "USD",
      local: "fr_FR",
      pageSize: 20,
      pageIndex: page,
      sortBy: "orders,desc"
    });

    const products = findProductArray(searchResp && searchResp.data ? searchResp.data : {});
    if (!products) {
      return NextResponse.json({
        added: 0,
        exhausted: true,
        error: "SEARCH_PARSE",
        raw: JSON.stringify(searchResp).slice(0, 900)
      });
    }
    if (products.length === 0) {
      return NextResponse.json({ added: 0, exhausted: true });
    }

    let added = 0;
    const log = [];
    for (const p of products) {
      if (added >= need) break;
      const id = String(firstDefined(p.productId, p.product_id, p.itemId, p.item_id) || "");
      if (!/^\d{6,}$/.test(id)) continue;

      const exists = await prisma.product.findFirst({ where: { aliexpressId: id } });
      if (exists) continue;

      const searchPrice = parseFloat(firstDefined(
        p.salePrice && p.salePrice.value, p.sale_price, p.salePrice, p.targetSalePrice, p.price
      ));
      if (!Number.isNaN(searchPrice) && entry.maxUsd && searchPrice > entry.maxUsd) continue;

      // Details in Arabic for the AR title + SKU/images (China-stocked variant preferred).
      let detail;
      try {
        detail = await client.productDetails({
          product_id: Number(id),
          ship_to_country: "CN",
          target_currency: "USD",
          target_language: "ar"
        });
      } catch {
        continue;
      }
      const root = detail && detail.data ? detail.data : {};
      const resp = root.aliexpress_ds_product_get_response || root;
      const r = resp.result || resp.rsp_result || resp;
      const base = firstDefined(r.ae_item_base_info_dto, r.ae_item_base_info, {}) || {};
      const multimedia = firstDefined(r.ae_multimedia_info_dto, r.ae_multimedia_info, {}) || {};

      const skuInfo = r.ae_item_sku_info_dtos || {};
      let skus = skuInfo;
      if (!Array.isArray(skus)) skus = firstDefined(skuInfo.ae_item_sku_info_d_t_o, skuInfo.ae_item_sku_info_dto, []);
      if (!Array.isArray(skus)) skus = [skus].filter(Boolean);

      const candidates = skus
        .map((s) => ({
          attr: String(firstDefined(s.sku_attr, s.id) || ""),
          price: parseFloat(firstDefined(s.offer_sale_price, s.sku_price, s.offer_bulk_sale_price)),
          stock: parseInt(firstDefined(s.sku_available_stock, s.s_k_u_available_stock, "0"), 10)
        }))
        .filter((x) => !Number.isNaN(x.price) && x.stock > 0);
      if (candidates.length === 0) continue;

      // Prefer China-stocked variants (short lead time to Guangzhou), then cheapest.
      const cn = candidates.filter((x) => /#CN\b|#china/i.test(x.attr));
      const pool = cn.length ? cn : candidates;
      pool.sort((a, b) => a.price - b.price);
      const chosen = pool[0];
      if (entry.maxUsd && chosen.price > entry.maxUsd) continue;

      let images = [];
      const imageUrls = firstDefined(multimedia.image_urls, base.image_urls);
      if (typeof imageUrls === "string") images = imageUrls.split(";").filter(Boolean).slice(0, 6);

      const titleFr = String(firstDefined(p.title, p.product_title, base.subject) || "").slice(0, 190);
      const titleAr = String(firstDefined(base.subject, titleFr) || "").slice(0, 190);
      if (!titleFr && !titleAr) continue;

      const priceMru = Math.ceil((chosen.price * RATE * MARKUP) / 10) * 10;

      await prisma.product.create({
        data: {
          nameAr: titleAr || titleFr,
          nameFr: titleFr || titleAr,
          descAr: titleAr || titleFr,
          descFr: titleFr || titleAr,
          priceMru,
          category: catSlug,
          subcategory: subSlug,
          emoji: "📦",
          stocked: false,
          imageUrl: images[0] || null,
          imagesJson: JSON.stringify(images),
          aliexpressId: id,
          skuAttr: chosen.attr || null,
          costUsd: chosen.price
        }
      });
      added++;
      log.push(`${id} $${chosen.price} → ${priceMru} MRU`);
    }

    return NextResponse.json({
      added,
      scanned: products.length,
      exhausted: products.length < 20,
      nextPage: page + 1,
      log
    });
  } catch (e) {
    return NextResponse.json(
      { added: 0, error: String(e && e.message ? e.message : e).slice(0, 400) },
      { status: 502 }
    );
  }
}
