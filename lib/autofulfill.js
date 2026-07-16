const { prisma } = require("./db");
const { getClient } = require("./aliexpress");
const { WAREHOUSE, warehouseConfigured } = require("./warehouse");

// Automatically creates the matching AliExpress order (shipped to the
// Guangzhou warehouse) for a confirmed website order. Never throws — all
// failures are recorded on the order as aeOrderError for the admin panel.
async function autoPurchase(orderRef) {
  let order;
  try {
    order = await prisma.order.findUnique({ where: { ref: orderRef } });
    if (!order) return;
    if (order.aeOrderId) return; // already purchased

    let items = [];
    try {
      items = JSON.parse(order.itemsJson || "[]");
    } catch {}
    if (items.length === 0) return;

    const ids = items.map((i) => i.id);
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });

    const productItems = [];
    const skipped = [];
    for (const item of items) {
      const p = products.find((x) => x.id === item.id);
      if (!p || !p.aliexpressId) {
        skipped.push(item.nameFr || item.nameAr || `#${item.id}`);
        continue;
      }
      productItems.push({
        product_id: Number(p.aliexpressId),
        product_count: Math.max(1, item.qty | 0),
        ...(p.skuAttr ? { sku_attr: p.skuAttr } : {})
      });
    }

    if (productItems.length === 0) {
      // Nothing to buy on AliExpress (all warehouse-stocked items) — not an error.
      return;
    }

    if (!warehouseConfigured()) {
      await prisma.order.update({
        where: { id: order.id },
        data: { aeOrderError: "Warehouse address not configured (GZ_WH_* env vars)" }
      });
      return;
    }

    const client = await getClient();
    const response = await client.createOrder({
      logistics_address: WAREHOUSE,
      product_items: productItems
    });

    const result =
      response && response.data && response.data.aliexpress_trade_buy_placeorder_response
        ? response.data.aliexpress_trade_buy_placeorder_response.result
        : null;

    if (result && result.is_success && Array.isArray(result.order_list) && result.order_list.length > 0) {
      const note = skipped.length ? ` (stocked items not ordered: ${skipped.join(", ")})` : "";
      await prisma.order.update({
        where: { id: order.id },
        data: {
          aeOrderId: result.order_list.join(","),
          aeOrderError: skipped.length ? `OK${note}` : null
        }
      });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { aeOrderError: ("AE order failed: " + JSON.stringify(response)).slice(0, 500) }
      });
    }
  } catch (e) {
    try {
      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { aeOrderError: String(e && e.message ? e.message : e).slice(0, 500) }
        });
      }
    } catch {}
  }
}

module.exports = { autoPurchase };
