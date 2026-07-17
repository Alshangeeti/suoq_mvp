// Category tree modeled on AliExpress's department structure, localized AR/FR.
// Legacy slugs (electronics/home/fashion/beauty) are kept as mains so existing
// products stay correctly categorized.
// Used only to seed the database on first run — the live tree is in the DB.
const DEFAULT_TREE = [
  {
    slug: "fashion", emoji: "👗", ar: "أزياء", fr: "Mode",
    subs: [
      { slug: "abayas", ar: "عبايات وملاحف", fr: "Abayas & melhfas" },
      { slug: "dresses", ar: "فساتين", fr: "Robes" },
      { slug: "men-clothing", ar: "ملابس رجالية", fr: "Vêtements homme" },
      { slug: "shoes", ar: "أحذية", fr: "Chaussures" },
      { slug: "bags", ar: "حقائب", fr: "Sacs" }
    ]
  },
  {
    slug: "phones", emoji: "📱", ar: "الهواتف والاتصالات", fr: "Téléphones",
    subs: [
      { slug: "smartphones", ar: "هواتف ذكية", fr: "Smartphones" },
      { slug: "phone-cases", ar: "أغلفة وحمايات", fr: "Coques & protections" },
      { slug: "chargers", ar: "شواحن وكوابل", fr: "Chargeurs & câbles" },
      { slug: "power-banks", ar: "بطاريات متنقلة", fr: "Batteries externes" }
    ]
  },
  {
    slug: "electronics", emoji: "🎧", ar: "إلكترونيات", fr: "Électronique",
    subs: [
      { slug: "audio", ar: "سماعات وصوتيات", fr: "Audio & écouteurs" },
      { slug: "smartwatches", ar: "ساعات ذكية", fr: "Montres connectées" },
      { slug: "cameras", ar: "كاميرات", fr: "Caméras" },
      { slug: "gaming", ar: "ألعاب فيديو", fr: "Gaming" }
    ]
  },
  {
    slug: "computer", emoji: "💻", ar: "الكمبيوتر والمكتب", fr: "Informatique & bureau",
    subs: [
      { slug: "laptops", ar: "لابتوبات", fr: "Ordinateurs portables" },
      { slug: "accessories", ar: "إكسسوارات الكمبيوتر", fr: "Accessoires PC" },
      { slug: "storage", ar: "أجهزة تخزين", fr: "Stockage" },
      { slug: "office", ar: "لوازم مكتبية", fr: "Fournitures de bureau" }
    ]
  },
  {
    slug: "home", emoji: "🏠", ar: "المنزل والمطبخ", fr: "Maison & cuisine",
    subs: [
      { slug: "kitchen", ar: "أدوات المطبخ", fr: "Ustensiles de cuisine" },
      { slug: "decor", ar: "ديكور", fr: "Décoration" },
      { slug: "lighting", ar: "إضاءة", fr: "Éclairage" },
      { slug: "organization", ar: "تنظيم وتخزين", fr: "Rangement" }
    ]
  },
  {
    slug: "appliances", emoji: "🔌", ar: "الأجهزة المنزلية", fr: "Électroménager",
    subs: [
      { slug: "small-appliances", ar: "أجهزة صغيرة", fr: "Petit électroménager" },
      { slug: "blenders", ar: "خلاطات ومحضرات", fr: "Mixeurs & robots" },
      { slug: "irons", ar: "مكاوي", fr: "Fers à repasser" },
      { slug: "fans", ar: "مراوح وتكييف", fr: "Ventilateurs & clim" }
    ]
  },
  {
    slug: "beauty", emoji: "💄", ar: "الجمال والصحة", fr: "Beauté & santé",
    subs: [
      { slug: "makeup", ar: "مكياج", fr: "Maquillage" },
      { slug: "skincare", ar: "العناية بالبشرة", fr: "Soins de la peau" },
      { slug: "haircare", ar: "العناية بالشعر", fr: "Soins des cheveux" },
      { slug: "perfumes", ar: "عطور", fr: "Parfums" }
    ]
  },
  {
    slug: "jewelry", emoji: "💍", ar: "المجوهرات والساعات", fr: "Bijoux & montres",
    subs: [
      { slug: "watches", ar: "ساعات", fr: "Montres" },
      { slug: "rings", ar: "خواتم وأساور", fr: "Bagues & bracelets" },
      { slug: "necklaces", ar: "قلادات", fr: "Colliers" },
      { slug: "sunglasses", ar: "نظارات شمسية", fr: "Lunettes de soleil" }
    ]
  },
  {
    slug: "kids", emoji: "🧸", ar: "الأطفال والألعاب", fr: "Enfants & jouets",
    subs: [
      { slug: "kids-clothing", ar: "ملابس أطفال", fr: "Vêtements enfants" },
      { slug: "toys", ar: "ألعاب", fr: "Jouets" },
      { slug: "baby", ar: "مستلزمات المواليد", fr: "Articles bébé" },
      { slug: "school", ar: "لوازم مدرسية", fr: "Fournitures scolaires" }
    ]
  },
  {
    slug: "sports", emoji: "⚽", ar: "الرياضة والهواء الطلق", fr: "Sport & plein air",
    subs: [
      { slug: "sportswear", ar: "ملابس رياضية", fr: "Vêtements de sport" },
      { slug: "fitness", ar: "معدات لياقة", fr: "Fitness" },
      { slug: "camping", ar: "تخييم ورحلات", fr: "Camping" },
      { slug: "football", ar: "كرة القدم", fr: "Football" }
    ]
  },
  {
    slug: "auto", emoji: "🚗", ar: "السيارات والدراجات", fr: "Auto & moto",
    subs: [
      { slug: "car-accessories", ar: "إكسسوارات السيارات", fr: "Accessoires auto" },
      { slug: "car-electronics", ar: "إلكترونيات السيارة", fr: "Électronique auto" },
      { slug: "motorcycle", ar: "دراجات نارية", fr: "Motos" },
      { slug: "tools-auto", ar: "عدد للسيارة", fr: "Outils auto" }
    ]
  },
  {
    slug: "tools", emoji: "🔧", ar: "الأدوات والعدد", fr: "Outils & bricolage",
    subs: [
      { slug: "hand-tools", ar: "عدد يدوية", fr: "Outils à main" },
      { slug: "power-tools", ar: "عدد كهربائية", fr: "Outils électriques" },
      { slug: "garden", ar: "أدوات الحديقة", fr: "Jardinage" },
      { slug: "hardware", ar: "مستلزمات منزلية", fr: "Quincaillerie" }
    ]
  }
];

const { prisma } = require("./db");

async function getCategoryTree() {
  const cats = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { subs: { orderBy: { id: "asc" } } }
  });
  return cats.map((c) => ({
    slug: c.slug,
    ar: c.ar,
    fr: c.fr,
    subs: c.subs.map((s) => ({ slug: s.slug, ar: s.ar, fr: s.fr }))
  }));
}

async function findCategoryDb(slug) {
  const c = await prisma.category.findUnique({
    where: { slug },
    include: { subs: { orderBy: { id: "asc" } } }
  });
  if (!c) return null;
  return { slug: c.slug, ar: c.ar, fr: c.fr, subs: c.subs.map((s) => ({ slug: s.slug, ar: s.ar, fr: s.fr })) };
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "cat";
}

module.exports = { DEFAULT_TREE, getCategoryTree, findCategoryDb, slugify };
