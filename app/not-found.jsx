import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-6xl mb-4">🧭</p>
      <h1 className="font-black text-2xl mb-2">الصفحة غير موجودة · Page introuvable</h1>
      <p className="text-souq-ink/60 mb-6">جرب البحث أو تصفح الأقسام · Essayez la recherche ou les catégories</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className="bg-souq-green text-white font-bold rounded-full px-6 py-2">الرئيسية · Accueil</Link>
        <Link href="/category/electronics" className="bg-white border border-souq-goldlight font-bold rounded-full px-5 py-2">إلكترونيات</Link>
        <Link href="/category/home" className="bg-white border border-souq-goldlight font-bold rounded-full px-5 py-2">المنزل</Link>
        <Link href="/category/fashion" className="bg-white border border-souq-goldlight font-bold rounded-full px-5 py-2">أزياء</Link>
      </div>
    </div>
  );
}
