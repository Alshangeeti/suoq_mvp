export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";
import { getClient } from "../../../../lib/aliexpress";

// Extracts a numeric AliExpress product ID from a pasted URL or raw ID.
function parseProductId(input) {
  const s = String(input || "").trim();
  if (/^\d{6,}$/.test(s)) return s;
  const m = s.match(/item\/(\d+)\.html/) || s.match(/item\/(\d+)/) || s.match(/(\d{10,})/);
  return m ? m[1] : null;
}

function firstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}

// POST { url } → preview: title, images, price range (USD)
export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const productId = parseProductId(body.url);
  if (!productId) return NextResponse.json({ error: "Could not find a product ID in that link" }, { status: 400 });

  try {
    const client = await getClient();
    const result = await client.productDetails({
      product_id: Number(productId),
      ship_to_country: "MR",
      target_currency: "USD",
      target_language: "en"
    });

    // Defensive unwrapping — response nesting varies by gateway version.
    const root = result && result.data ? result.data : {};
    const resp = firstDefined(
      root.aliexpress_ds_product_get_response,
      root
    );
    const r = firstDefined(resp.result, resp.rsp_result, resp);
    const base = firstDefined(r.ae_item_base_info_dto, r.ae_item_base_info, {});
    const multimedia = firstDefined(r.ae_multimedia_info_dto, r.ae_multimedia_info, {});
    const skuInfo = firstDefined(r.ae_item_sku_info_dtos, {});

    const title = firstDefined(base.subject, base.product_title);
    let images = [];
    const imageUrls = firstDefined(multimedia.image_urls, base.image_urls);
    if (typeof imageUrls === "string") images = imageUrls.split(";").filter(Boolean);

    // The SKU list arrives either as a plain array or wrapped in a
    // *_d_t_o / *_dto object depending on the product/gateway version.
    let skus = skuInfo;
    if (!Array.isArray(skus)) {
      skus = firstDefined(skuInfo.ae_item_sku_info_d_t_o, skuInfo.ae_item_sku_info_dto, []);
    }
    if (!Array.isArray(skus)) skus = [skus].filter(Boolean);
    const prices = skus
      .map((s) => parseFloat(firstDefined(s.offer_sale_price, s.sku_price, s.offer_bulk_sale_price)))
      .filter((n) => !Number.isNaN(n));
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;

    // Default variant: the cheapest available SKU's attribute string —
    // used later when auto-ordering this product to the warehouse.
    let skuAttr = null;
    if (skus.length > 0) {
      const withPrice = skus
        .map((s) => ({
          attr: firstDefined(s.sku_attr, s.id),
          price: parseFloat(firstDefined(s.offer_sale_price, s.sku_price, s.offer_bulk_sale_price))
        }))
        .filter((x) => x.attr);
      withPrice.sort((a, b) => (a.price || 0) - (b.price || 0));
      if (withPrice.length > 0) skuAttr = String(withPrice[0].attr);
    }

    if (!title && images.length === 0) {
      return NextResponse.json(
        { error: "Unrecognized API response", raw: JSON.stringify(result).slice(0, 1500) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      productId,
      title,
      images: images.slice(0, 6),
      minPriceUsd: minPrice,
      maxPriceUsd: maxPrice,
      skuAttr
    });
  } catch (e) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 502 });
  }
}
