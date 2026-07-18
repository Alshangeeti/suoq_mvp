"use client";
// Opens a print-ready shipping slip in a new tab (browser print → save as
// PDF). Used by both the admin panel and the seller portal.
export function openShippingSlip({ ref, date, customerName, phone, city, address, items, totalMru, seller }) {
  const gpsMatch = String(address || "").match(/GPS:\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  const mapsLink = gpsMatch ? `https://maps.google.com/?q=${gpsMatch[1]},${gpsMatch[2]}` : null;

  const rows = (items || [])
    .map(
      (it) => `<tr>
        <td>${esc(it.nameAr || it.nameFr)}${it.variantLabel ? `<br><small>${esc(it.variantLabel)}</small>` : ""}</td>
        <td class="c">${it.qty}</td>
        <td class="c">${(it.priceMru * it.qty).toLocaleString()}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>بوليصة شحن ${esc(ref)}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 24px; color: #1B231E; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0B4D36; padding-bottom: 12px; }
  .brand { font-size: 20px; font-weight: 900; color: #0B4D36; }
  .brand small { display:block; font-weight: 400; color:#666; font-size: 11px; }
  .ref { font-size: 26px; font-weight: 900; font-family: monospace; }
  .box { border: 2px solid #0B4D36; border-radius: 12px; padding: 14px 16px; margin-top: 16px; }
  .box h2 { margin: 0 0 8px; font-size: 13px; color: #0B4D36; }
  .line { margin: 4px 0; font-size: 15px; }
  .line b { display: inline-block; min-width: 110px; color: #555; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #cbb; padding: 8px 10px; text-align: right; font-size: 13px; }
  th { background: #0B4D36; color: #fff; }
  td.c, th.c { text-align: center; }
  .total { text-align: left; font-size: 17px; font-weight: 900; color: #0B4D36; margin-top: 10px; }
  .foot { margin-top: 24px; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
  .print-btn { position: fixed; top: 10px; left: 10px; padding: 8px 20px; background:#0B4D36; color:#fff; border:0; border-radius: 20px; font-weight:700; cursor:pointer; }
  @media print { .print-btn { display: none; } body { margin: 8px; } }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨 طباعة / PDF</button>
  <div class="head">
    <div class="brand">سوق موريتانيا<small>souqmauritania.com — Guangzhou ⇄ Nouakchott</small></div>
    <div class="ref">${esc(ref)}</div>
  </div>

  <div class="box">
    <h2>بيانات المستلم — Destinataire</h2>
    <div class="line"><b>الاسم / Nom</b> ${esc(customerName)}</div>
    <div class="line"><b>الهاتف / Tél</b> <span dir="ltr">+222 ${esc(phone)}</span></div>
    <div class="line"><b>المدينة / Ville</b> ${esc(city)}</div>
    <div class="line"><b>العنوان / Adresse</b> ${esc(address)}</div>
    ${mapsLink ? `<div class="line"><b>الخريطة / Carte</b> <span dir="ltr">${mapsLink}</span></div>` : ""}
    ${seller ? `<div class="line"><b>البائع / Vendeur</b> ${esc(seller)}</div>` : ""}
    <div class="line"><b>التاريخ / Date</b> ${new Date(date).toLocaleDateString("fr-FR")}</div>
  </div>

  <table>
    <thead><tr><th>المنتج / Produit</th><th class="c">الكمية</th><th class="c">المبلغ (MRU)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">المجموع / Total : ${Number(totalMru || 0).toLocaleString()} MRU</div>

  <div class="foot">بوليصة شحن صادرة من سوق موريتانيا — للاستفسار: souqmauritania.com</div>
  <script>setTimeout(() => window.print(), 400);</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
