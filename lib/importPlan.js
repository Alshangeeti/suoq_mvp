// Bulk-import sourcing plan tuned to Mauritanian demand: popular, low-cost
// items (sorted by order volume on AliExpress), shippable within China to the
// Guangzhou warehouse. Each entry: search keyword (FR), category/subcategory
// mapping (created automatically if missing), product count and a max unit
// cost in USD to keep prices competitive.
const IMPORT_PLAN = [
  { kw: "coque telephone silicone", cat: ["phones", "الهواتف والاتصالات", "Téléphones"], sub: ["phone-cases", "أغلفة وحمايات", "Coques & protections"], count: 25, maxUsd: 6 },
  { kw: "chargeur rapide usb c", cat: ["phones", "الهواتف والاتصالات", "Téléphones"], sub: ["chargers", "شواحن وكوابل", "Chargeurs & câbles"], count: 25, maxUsd: 10 },
  { kw: "batterie externe 20000mah", cat: ["phones", "الهواتف والاتصالات", "Téléphones"], sub: ["power-banks", "بطاريات متنقلة", "Batteries externes"], count: 20, maxUsd: 20 },
  { kw: "support telephone voiture", cat: ["phones", "الهواتف والاتصالات", "Téléphones"], sub: ["phone-cases", "أغلفة وحمايات", "Coques & protections"], count: 15, maxUsd: 8 },
  { kw: "ecouteurs bluetooth sans fil", cat: ["electronics", "إلكترونيات", "Électronique"], sub: ["audio", "سماعات وصوتيات", "Audio & écouteurs"], count: 25, maxUsd: 12 },
  { kw: "haut parleur bluetooth", cat: ["electronics", "إلكترونيات", "Électronique"], sub: ["audio", "سماعات وصوتيات", "Audio & écouteurs"], count: 15, maxUsd: 20 },
  { kw: "montre connectee sport", cat: ["electronics", "إلكترونيات", "Électronique"], sub: ["smartwatches", "ساعات ذكية", "Montres connectées"], count: 20, maxUsd: 18 },
  { kw: "camera surveillance wifi", cat: ["electronics", "إلكترونيات", "Électronique"], sub: ["cameras", "كاميرات", "Caméras"], count: 10, maxUsd: 25 },
  { kw: "ustensiles cuisine set", cat: ["home", "المنزل والمطبخ", "Maison & cuisine"], sub: ["kitchen", "أدوات المطبخ", "Ustensiles de cuisine"], count: 25, maxUsd: 12 },
  { kw: "theiere the service plateau", cat: ["home", "المنزل والمطبخ", "Maison & cuisine"], sub: ["kitchen", "أدوات المطبخ", "Ustensiles de cuisine"], count: 15, maxUsd: 20 },
  { kw: "lampe solaire exterieur", cat: ["home", "المنزل والمطبخ", "Maison & cuisine"], sub: ["lighting", "إضاءة", "Éclairage"], count: 20, maxUsd: 15 },
  { kw: "boite rangement maison", cat: ["home", "المنزل والمطبخ", "Maison & cuisine"], sub: ["organization", "تنظيم وتخزين", "Rangement"], count: 15, maxUsd: 10 },
  { kw: "mixeur portable rechargeable", cat: ["appliances", "الأجهزة المنزلية", "Électroménager"], sub: ["blenders", "خلاطات ومحضرات", "Mixeurs & robots"], count: 15, maxUsd: 15 },
  { kw: "bouilloire electrique", cat: ["appliances", "الأجهزة المنزلية", "Électroménager"], sub: ["small-appliances", "أجهزة صغيرة", "Petit électroménager"], count: 10, maxUsd: 18 },
  { kw: "ventilateur portable rechargeable", cat: ["appliances", "الأجهزة المنزلية", "Électroménager"], sub: ["fans", "مراوح وتكييف", "Ventilateurs & clim"], count: 15, maxUsd: 15 },
  { kw: "soin cheveux huile", cat: ["beauty", "الجمال والصحة", "Beauté & santé"], sub: ["haircare", "العناية بالشعر", "Soins des cheveux"], count: 15, maxUsd: 12 },
  { kw: "maquillage set pinceaux", cat: ["beauty", "الجمال والصحة", "Beauté & santé"], sub: ["makeup", "مكياج", "Maquillage"], count: 15, maxUsd: 12 },
  { kw: "serum visage soin", cat: ["beauty", "الجمال والصحة", "Beauté & santé"], sub: ["skincare", "العناية بالبشرة", "Soins de la peau"], count: 10, maxUsd: 12 },
  { kw: "montre homme quartz", cat: ["jewelry", "المجوهرات والساعات", "Bijoux & montres"], sub: ["watches", "ساعات", "Montres"], count: 20, maxUsd: 15 },
  { kw: "lunettes de soleil polarisees", cat: ["jewelry", "المجوهرات والساعات", "Bijoux & montres"], sub: ["sunglasses", "نظارات شمسية", "Lunettes de soleil"], count: 20, maxUsd: 8 },
  { kw: "abaya femme musulmane robe", cat: ["fashion", "أزياء", "Mode"], sub: ["abayas", "عبايات وملاحف", "Abayas & melhfas"], count: 20, maxUsd: 20 },
  { kw: "foulard voile chiffon femme", cat: ["fashion", "أزياء", "Mode"], sub: ["abayas", "عبايات وملاحف", "Abayas & melhfas"], count: 15, maxUsd: 8 },
  { kw: "sac a dos impermeable", cat: ["fashion", "أزياء", "Mode"], sub: ["bags", "حقائب", "Sacs"], count: 15, maxUsd: 15 },
  { kw: "sac main femme", cat: ["fashion", "أزياء", "Mode"], sub: ["bags", "حقائب", "Sacs"], count: 10, maxUsd: 15 },
  { kw: "sandales homme ete", cat: ["fashion", "أزياء", "Mode"], sub: ["shoes", "أحذية", "Chaussures"], count: 10, maxUsd: 12 },
  { kw: "jouet educatif enfant", cat: ["kids", "الأطفال والألعاب", "Enfants & jouets"], sub: ["toys", "ألعاب", "Jouets"], count: 20, maxUsd: 10 },
  { kw: "accessoires bebe biberon", cat: ["kids", "الأطفال والألعاب", "Enfants & jouets"], sub: ["baby", "مستلزمات المواليد", "Articles bébé"], count: 10, maxUsd: 10 },
  { kw: "ballon football taille 5", cat: ["sports", "الرياضة والهواء الطلق", "Sport & plein air"], sub: ["football", "كرة القدم", "Football"], count: 10, maxUsd: 12 },
  { kw: "corde a sauter fitness", cat: ["sports", "الرياضة والهواء الطلق", "Sport & plein air"], sub: ["fitness", "معدات لياقة", "Fitness"], count: 10, maxUsd: 10 },
  { kw: "accessoires voiture interieur", cat: ["auto", "السيارات والدراجات", "Auto & moto"], sub: ["car-accessories", "إكسسوارات السيارات", "Accessoires auto"], count: 15, maxUsd: 10 },
  { kw: "outils bricolage set", cat: ["tools", "الأدوات والعدد", "Outils & bricolage"], sub: ["hand-tools", "عدد يدوية", "Outils à main"], count: 15, maxUsd: 15 }
];

module.exports = { IMPORT_PLAN };
