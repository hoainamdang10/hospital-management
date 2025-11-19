import crypto from "crypto";
import { ILogger } from "@shared/application/services/logger.interface";

export interface VnpayConfig {
  tmnCode: string;
  hashSecret: string;
  baseUrl: string;
  returnUrl?: string;
  ipAddress?: string;
  orderType?: string;
  locale?: string;
  timeZone?: string;
}

export interface CreatePaymentLinkRequest {
  orderCode: number;
  amount: number;
  description: string;
  buyerEmail?: string;
  returnUrl?: string;
}

export interface PaymentLinkResponse {
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  orderCode: number;
  amount: number;
}

export interface WebhookData {
  orderCode: number;
  amount: number;
  description: string;
  reference: string;
  transactionDateTime: string;
  code: string;
  desc: string;
  bankCode?: string;
  bankTranNo?: string;
  currency?: string;
}

export class VnpayIntegrationService {
  constructor(
    private readonly config: VnpayConfig,
    private readonly logger: ILogger,
  ) {}

  async createPaymentLink(
    request: CreatePaymentLinkRequest,
  ): Promise<PaymentLinkResponse> {
    const orderRef = request.orderCode.toString();
    const amountInMinor = Math.round(request.amount * 100);
    const createDate = this.formatDate(new Date());
    const expireDate = this.formatDate(new Date(Date.now() + 15 * 60 * 1000));

    const params: Record<string, string> = {
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
    const checkoutUrl = `${
      this.config.baseUrl
    }?${signedQuery}&vnp_SecureHash=${secureHash}&vnp_SecureHashType=HmacSHA512`;

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

  verifyIpnSignature(
    params: Record<string, string | undefined>,
    signature: string,
  ): boolean {
    if (!signature) {
      return false;
    }
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key === "vnp_SecureHash" || key === "vnp_SecureHashType") continue;
      if (typeof value === "undefined") continue;
      data[key] = value;
    }
    // CRITICAL: VNPAY sends IPN with RAW (non-encoded) query parameters
    // We must verify signature WITHOUT encoding the values
    const expected = this.generateIpnSecureHash(data);
    // CRITICAL: VNPAY sends lowercase signature, we generate uppercase
    // Compare case-insensitive
    const isValid = expected.toLowerCase() === signature.toLowerCase();
    this.logger.info("VNPAY IPN signature verification", {
      isValid,
      orderCode: params.vnp_TxnRef,
      expectedHash: expected.substring(0, 20) + '...',
      receivedHash: signature.substring(0, 20) + '...',
    });
    return isValid;
  }

  static generateOrderCode(): number {
    return Math.floor(Date.now() / 1000);
  }

  private formatDate(date: Date): string {
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
    const getValue = (type: Intl.DateTimeFormatPartTypes): string => {
      const part = parts.find((p) => p.type === type);
      return part?.value ?? "";
    };

    return (
      getValue("year") +
      getValue("month") +
      getValue("day") +
      getValue("hour") +
      getValue("minute") +
      getValue("second")
    );
  }

  private createSignedQuery(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    return sortedKeys
      .map((key) => `${key}=${this.encodeValue(params[key])}`)
      .join("&");
  }

  private generateSecureHash(data: Record<string, string>): string {
    const sortedKeys = Object.keys(data).sort();
    const signData = sortedKeys
      .map((key) => `${key}=${this.encodeValue(data[key])}`)
      .join("&");
    return crypto
      .createHmac("sha512", this.config.hashSecret)
      .update(signData)
      .digest("hex")
      .toUpperCase();
  }

  /**
   * Generate secure hash for IPN verification
   * CRITICAL DISCOVERY: VNPAY sends RAW values in IPN but hashes URL-encoded values!
   * - IPN query params: "Thanh toán hóa đơn" (raw)
   * - Hash input: "Thanh+to%C3%A1n+h%C3%B3a+%C4%91%C6%A1n" (URL-encoded with + for space)
   */
  private generateIpnSecureHash(data: Record<string, string>): string {
    const sortedKeys = Object.keys(data).sort();
    const signData = sortedKeys
      .map((key) => {
        // CRITICAL: URL-encode values with + for space (PHP urlencode style)
        const encodedValue = this.encodeValue(data[key]);
        return `${key}=${encodedValue}`;
      })
      .join("&");

    const hash = crypto
      .createHmac("sha512", this.config.hashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest("hex")
      .toUpperCase();

    this.logger.info("IPN signature generation details", {
      queryString: signData.substring(0, 100) + '...',
      hashSecret: this.config.hashSecret.substring(0, 10) + '...',
      generatedHash: hash.substring(0, 20) + '...',
    });

    return hash;
  }

  private encodeValue(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, "+");
  }
}
