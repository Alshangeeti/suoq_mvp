const { prisma } = require("./db");
const { verifySessionToken } = require("./auth");

// Resolves the logged-in customer from the session cookie. Supports both the
// new id-based tokens ("id:123") and legacy phone-based tokens still living
// in customers' browsers.
async function getSessionCustomer(req) {
  const token = req.cookies.get("souq_session")?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session || !session.sub) return null;
  if (session.sub.startsWith("id:")) {
    const id = parseInt(session.sub.slice(3), 10);
    if (Number.isNaN(id)) return null;
    return prisma.customer.findUnique({ where: { id } });
  }
  return prisma.customer.findUnique({ where: { phone: session.sub } });
}

module.exports = { getSessionCustomer };
