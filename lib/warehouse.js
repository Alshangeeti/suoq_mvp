// Guangzhou warehouse — the fixed shipping destination for every AliExpress
// order placed by the auto-fulfillment pipeline. AliExpress requires Chinese
// administrative names (province/city/district) for CN addresses, matching
// their location dictionary. Override any field with env vars.
const WAREHOUSE = {
  contact_person: process.env.GZ_WH_NAME || "Souq Mauritania Warehouse",
  full_name: process.env.GZ_WH_NAME || "Souq Mauritania Warehouse",
  mobile_no: process.env.GZ_WH_PHONE || "13800000000",
  phone_country: "+86",
  country: "CN",
  province: process.env.GZ_WH_PROVINCE || "广东省",
  city: process.env.GZ_WH_CITY || "广州市",
  county: process.env.GZ_WH_COUNTY || "白云区",
  address: process.env.GZ_WH_ADDRESS || "Room 101, Building 1, Test Street",
  zip: process.env.GZ_WH_ZIP || "510000",
  locale: "zh_CN"
};

function warehouseConfigured() {
  return !!(WAREHOUSE.contact_person && WAREHOUSE.mobile_no && WAREHOUSE.address);
}

module.exports = { WAREHOUSE, warehouseConfigured };
