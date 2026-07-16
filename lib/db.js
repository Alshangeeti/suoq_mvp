const { PrismaClient } = require("@prisma/client");
const globalForPrisma = globalThis;

function getClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: avoids instantiating PrismaClient (which validates DATABASE_URL
// immediately) at module-load time. Next.js imports route modules during its
// build-time "collect page data" step, which would otherwise crash the build
// if the DB env var isn't present in that build context.
const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    }
  }
);

module.exports = { prisma };
