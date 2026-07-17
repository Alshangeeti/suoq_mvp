const crypto = require("crypto");

// scrypt password hashing — no external dependencies.
// Stored format: scrypt:<salt-hex>:<hash-hex>
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hash] = String(stored || "").split(":");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const check = crypto.scryptSync(String(password), salt, 64);
    return crypto.timingSafeEqual(check, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
