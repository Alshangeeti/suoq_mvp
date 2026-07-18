const { prisma } = require("./db");
const { createSessionToken, verifySessionToken } = require("./auth");

// Seller sessions live in their own cookie, fully separate from customer
// and admin sessions. Token subject: "sid:<sellerId>".
function sellerToken(sellerId) {
  return createSessionToken("sid:" + sellerId);
}

async function getSessionSeller(req) {
  const token = req.cookies.get("souq_seller")?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session || !session.sub || !session.sub.startsWith("sid:")) return null;
  const id = parseInt(session.sub.slice(4), 10);
  if (Number.isNaN(id)) return null;
  return prisma.seller.findUnique({ where: { id } });
}

function setSellerCookie(res, sellerId) {
  res.cookies.set("souq_seller", sellerToken(sellerId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });
}

module.exports = { getSessionSeller, setSellerCookie };
