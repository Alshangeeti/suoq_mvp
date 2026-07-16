export const dynamic = "force-dynamic";
import { getClient } from "../../lib/aliexpress";

const KEY = "df7c73ecb209044780d5f81ffbd49d38";

async function inspect(searchParams) {
  if (searchParams?.key !== KEY) return "UNAUTHORIZED";
  const id = searchParams?.id;
  if (!id) return "NO_ID";
  try {
    const client = await getClient();
    const result = await client.productDetails({
      product_id: Number(id),
      ship_to_country: "MR",
      target_currency: "USD",
      target_language: "en"
    });
    const root = result && result.data ? result.data : {};
    const resp = root.aliexpress_ds_product_get_response || root;
    const r = resp.result || resp.rsp_result || resp;
    const skuInfo = r.ae_item_sku_info_dtos || {};
    let skus = skuInfo.ae_item_sku_info_d_t_o || skuInfo.ae_item_sku_info_dto || [];
    if (!Array.isArray(skus)) skus = [skus].filter(Boolean);
    if (skus.length === 0) return "NO_SKUS_FOUND raw=" + JSON.stringify(r).slice(0, 400);
    return (
      `COUNT=${skus.length} ` +
      skus
        .slice(0, 4)
        .map((s) =>
          `[attr=${s.sku_attr || "-"} id=${s.sku_id || "-"} price=${s.offer_sale_price || s.sku_price || "-"} stock=${s.sku_available_stock ?? s.s_k_u_available_stock ?? "-"}]`
        )
        .join(" ")
    ).slice(0, 700);
  } catch (e) {
    return "ERROR " + String(e && e.message ? e.message : e).slice(0, 300);
  }
}

export async function generateMetadata({ searchParams }) {
  return { title: await inspect(searchParams) };
}

export default function DebugSku() {
  return <div className="py-10 font-bold">See page title.</div>;
}
