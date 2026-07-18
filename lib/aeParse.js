// Shared AliExpress product-detail parsing: SKU/variant extraction.
function firstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}

function unwrapDetail(detail) {
  const root = detail && detail.data ? detail.data : {};
  const resp = root.aliexpress_ds_product_get_response || root;
  return resp.result || resp.rsp_result || resp;
}

function skuList(r) {
  const skuInfo = r.ae_item_sku_info_dtos || {};
  let skus = skuInfo;
  if (!Array.isArray(skus)) {
    skus = firstDefined(skuInfo.ae_item_sku_info_d_t_o, skuInfo.ae_item_sku_info_dto, []);
  }
  if (!Array.isArray(skus)) skus = [skus].filter(Boolean);
  return skus;
}

// Builds customer-facing variants: attribute string for ordering, a human
// label (colors/sizes — "Ships From" hidden), price and optional image.
function extractVariants(r) {
  const skus = skuList(r);
  const variants = [];
  for (const s of skus) {
    const attr = String(firstDefined(s.sku_attr, s.id) || "");
    const price = parseFloat(firstDefined(s.offer_sale_price, s.sku_price, s.offer_bulk_sale_price));
    const stock = parseInt(firstDefined(s.sku_available_stock, s.s_k_u_available_stock, "0"), 10);
    if (!attr || Number.isNaN(price) || stock <= 0) continue;

    let props = firstDefined(
      s.aeop_s_k_u_propertys && s.aeop_s_k_u_propertys.aeop_sku_property,
      s.aeop_s_k_u_propertys,
      []
    );
    if (!Array.isArray(props)) props = [props].filter(Boolean);

    const labelParts = [];
    let image = null;
    for (const p of props) {
      const propName = String(firstDefined(p.sku_property_name, "") || "");
      const value = String(
        firstDefined(p.property_value_definition_name, p.sku_property_value, "") || ""
      );
      if (p.sku_image && !image) image = String(p.sku_image);
      if (/ship|发货/i.test(propName)) continue; // warehouse origin, not a customer choice
      if (value) labelParts.push(value);
    }

    variants.push({
      attr,
      price,
      label: labelParts.join(" · ").slice(0, 120),
      image,
      cn: /#CN\b|#china/i.test(attr)
    });
    if (variants.length >= 30) break;
  }
  return variants;
}

module.exports = { unwrapDetail, extractVariants, firstDefined };
