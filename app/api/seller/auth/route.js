export const dynamic = "force-dynamic";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "../../../../lib/password";
import { isValidEmail } from "../../../../lib/email";
import { getSessionSeller, setSellerCookie } from "../../../../lib/sellerAuth";

export async function GET(req) {
  const seller = await getSessionSeller(req);
  if (!seller) return NextResponse.json({ seller: null });
  const { passwordHash, ...safe } = seller;
  return NextResponse.json({ seller: safe });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  if (body.action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("souq_seller", "", { maxAge: 0, path: "/" });
    return res;
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!isValidEmail(email)) return NextResponse.json({ error: "بريد إلكتروني غير صالح" }, { status: 400 });

  if (body.action === "signup") {
    if (password.length < 6) return NextResponse.json({ error: "كلمة المرور قصيرة (6 أحرف على الأقل)" }, { status: 400 });
    const businessName = String(body.businessName || "").trim().slice(0, 120);
    const ownerName = String(body.ownerName || "").trim().slice(0, 120);
    const phone = String(body.phone || "").replace(/\D/g, "").slice(0, 15);
    if (!businessName || !ownerName || !phone) {
      return NextResponse.json({ error: "أكمل جميع الحقول المطلوبة" }, { status: 400 });
    }
    try {
      const seller = await prisma.seller.create({
        data: {
          email,
          passwordHash: hashPassword(password),
          businessName,
          ownerName,
          phone,
          city: String(body.city || "").trim().slice(0, 60) || null,
          description: String(body.description || "").trim().slice(0, 1000) || null,
          licenseInfo: String(body.licenseInfo || "").trim().slice(0, 200) || null
        }
      });
      const res = NextResponse.json({ ok: true, status: seller.status });
      setSellerCookie(res, seller.id);
      return res;
    } catch (e) {
      if (e && e.code === "P2002") {
        return NextResponse.json({ error: "هذا البريد مسجل مسبقاً — سجل الدخول" }, { status: 409 });
      }
      throw e;
    }
  }

  if (body.action === "login") {
    const seller = await prisma.seller.findUnique({ where: { email } });
    if (!seller || !verifyPassword(password, seller.passwordHash)) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, status: seller.status });
    setSellerCookie(res, seller.id);
    return res;
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
