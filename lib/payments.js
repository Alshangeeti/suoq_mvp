// Payment methods available at checkout. Bankily auto-confirms via the SMS
// gateway; Masrvi/Sedad/Bank use a manual flow (customer pays, submits a
// transaction reference, admin verifies); COD confirms immediately and is
// collected at delivery.
const PAYMENT_METHODS = [
  { id: "BANKILY", icon: "📱", logo: "/payments/bankily.png", labelKey: "payBankily", descKey: "payBankilyDesc", mode: "auto" },
  { id: "MASRVI", icon: "📲", logo: "/payments/masrvi.avif", labelKey: "payMasrvi", descKey: "payMasrviDesc", mode: "manual" },
  { id: "SEDAD", icon: "💳", logo: "/payments/sedad.png", labelKey: "paySedad", descKey: "paySedadDesc", mode: "manual" },
  { id: "BANK", icon: "🏦", labelKey: "payBank", descKey: "payBankDesc", mode: "manual" },
  { id: "COD", icon: "💵", labelKey: "payCod", descKey: "payCodDesc", mode: "cod" }
];

const METHOD_IDS = PAYMENT_METHODS.map((m) => m.id);

function methodMode(id) {
  const m = PAYMENT_METHODS.find((x) => x.id === id);
  return m ? m.mode : "auto";
}

module.exports = { PAYMENT_METHODS, METHOD_IDS, methodMode };
