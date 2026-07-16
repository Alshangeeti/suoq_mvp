// Guangzhou warehouse — the fixed shipping destination for every AliExpress
// order placed by the auto-fulfillment pipeline. Values can be overridden
// with env vars without a code change.
const WAREHOUSE = {
  contact_person: process.env.GZ_WH_NAME || "",
  mobile_no: process.env.GZ_WH_PHONE || "",
  phone_country: "+86",
  country: "CN",
  province: process.env.GZ_WH_PROVINCE || "Guangdong",
  city: process.env.GZ_WH_CITY || "Guangzhou",
  address: process.env.GZ_WH_ADDRESS || "",
  zip: process.env.GZ_WH_ZIP || "",
  locale: "zh_CN"
};

function warehouseConfigured() {
  return !!(WAREHOUSE.contact_person && WAREHOUSE.mobile_no && WAREHOUSE.address);
}

module.exports = { WAREHOUSE, warehouseConfigured };
