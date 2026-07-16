function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-8);
}
module.exports = { normalizePhone };
