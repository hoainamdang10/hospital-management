"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VnpayIntegrationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class VnpayIntegrationService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    async createPaymentLink(request) {
        const orderRef = request.orderCode.toString();
        const amountInMinor = Math.round(request.amount * 100);
        const createDate = this.formatDate(new Date());
        const expireDate = this.formatDate(new Date(Date.now() + 15 * 60 * 1000));
        const params = {
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_TmnCode: this.config.tmnCode,
            vnp_Amount: amountInMinor.toString(),
            vnp_CurrCode: "VND",
            vnp_TxnRef: orderRef,
            vnp_OrderInfo: request.description,
            vnp_OrderType: this.config.orderType || "other",
            vnp_Locale: this.config.locale || "vn",
            vnp_ReturnUrl: request.returnUrl || this.config.returnUrl || "",
            vnp_IpAddr: this.config.ipAddress || "127.0.0.1",
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate,
        };
        const signedQuery = this.createSignedQuery(params);
        const secureHash = this.generateSecureHash(params);
        const checkoutUrl = `${this.config.baseUrl}?${signedQuery}&vnp_SecureHash=${secureHash}&vnp_SecureHashType=HmacSHA512`;
        this.logger.info("VNPAY payment link generated", {
            orderCode: request.orderCode,
            amount: request.amount,
        });
        return {
            checkoutUrl,
            qrCode: checkoutUrl,
            paymentLinkId: orderRef,
            orderCode: request.orderCode,
            amount: request.amount,
        };
    }
    verifyIpnSignature(params, signature) {
        if (!signature) {
            return false;
        }
        const data = {};
        for (const [key, value] of Object.entries(params)) {
            if (key === "vnp_SecureHash" || key === "vnp_SecureHashType")
                continue;
            if (typeof value === "undefined")
                continue;
            data[key] = value;
        }
        const expected = this.generateSecureHash(data);
        const isValid = expected === signature;
        this.logger.info("VNPAY IPN signature verification", {
            isValid,
            orderCode: params.vnp_TxnRef,
        });
        return isValid;
    }
    static generateOrderCode() {
        return Math.floor(Date.now() / 1000);
    }
    formatDate(date) {
        const timeZone = this.config.timeZone || "Asia/Ho_Chi_Minh";
        const formatter = new Intl.DateTimeFormat("en-GB", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
        const parts = formatter.formatToParts(date);
        const getValue = (type) => {
            const part = parts.find((p) => p.type === type);
            return part?.value ?? "";
        };
        return (getValue("year") +
            getValue("month") +
            getValue("day") +
            getValue("hour") +
            getValue("minute") +
            getValue("second"));
    }
    createSignedQuery(params) {
        const sortedKeys = Object.keys(params).sort();
        return sortedKeys
            .map((key) => `${key}=${this.encodeValue(params[key])}`)
            .join("&");
    }
    generateSecureHash(data) {
        const sortedKeys = Object.keys(data).sort();
        const signData = sortedKeys
            .map((key) => `${key}=${this.encodeValue(data[key])}`)
            .join("&");
        return crypto_1.default
            .createHmac("sha512", this.config.hashSecret)
            .update(signData)
            .digest("hex")
            .toUpperCase();
    }
    encodeValue(value) {
        return encodeURIComponent(value).replace(/%20/g, "+");
    }
}
exports.VnpayIntegrationService = VnpayIntegrationService;
//# sourceMappingURL=VnpayIntegrationService.js.map