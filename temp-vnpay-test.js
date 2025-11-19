const crypto = require("crypto");
const secret = "W6FYYY4F9EUIHYNTRUTJRAHT69IHNQLC";
const params = {
  vnp_Amount: "22000000",
  vnp_Command: "pay",
  vnp_CreateDate: "20251119153445",
  vnp_CurrCode: "VND",
  vnp_ExpireDate: "20251119154945",
  vnp_IpAddr: "127.0.0.1",
  vnp_Locale: "vn",
  vnp_OrderInfo: "Thanh toán hóa đơn INV-202511-5800",
  vnp_OrderType: "other",
  vnp_ReturnUrl: "http://localhost:3000/patient/billing/success",
  vnp_TmnCode: "JV4I3QQ0",
  vnp_TxnRef: "1763541285",
  vnp_Version: "2.1.0"
};
const encode = v => encodeURIComponent(v).replace(/%20/g, "+");
const sorted = Object.keys(params).sort();
const query = sorted.map(function(k){return k + "=" + encode(params[k]);}).join("&");
const hash = crypto.createHmac("sha512", secret).update(query).digest("hex");
console.log("query=", query);
console.log("hash=", hash);
