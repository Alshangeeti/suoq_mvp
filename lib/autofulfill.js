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
      const skuAttr = item.skuAttr || p.skuAttr;
      productItems.push({
        product_id: Number(p.aliexpressId),
        product_count: Math.max(1, item.qty | 0),
        ...(skuAttr ? { sku_attr: skuAttr } : {})
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
    // callAPIDirectly avoids ae_sdk's createOrder response unwrapping, which
    // crashes on error payloads and newer response envelopes.
    const response = await client.callAPIDirectly("aliexpress.ds.order.create", {
      param_place_order_request4_open_api_d_t_o: JSON.stringify({
        logistics_address: WAREHOUSE,
        product_items: productItems
      })
    });

    const data = response && response.data ? response.data : {};
    const envelope =
      data.aliexpress_ds_order_create_response ||
      data.aliexpress_trade_buy_placeorder_response ||
      data;
    const result = envelope && envelope.result ? envelope.result : envelope;

    let orderList = result && result.order_list ? result.order_list : null;
    if (orderList && !Array.isArray(orderList)) {
      orderList = orderList.number || orderList.order_id || [orderList];
    }
    if (orderList && !Array.isArray(orderList)) orderList = [orderList];

    if (result && result.is_success && Array.isArray(orderList) && orderList.length > 0) {
      const note = skipped.length ? ` (stocked items not ordered: ${skipped.join(", ")})` : "";
      await prisma.order.update({
        where: { id: order.id },
        data: {
          aeOrderId: orderList.join(","),
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
