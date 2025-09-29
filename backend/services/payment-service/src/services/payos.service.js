const PayOS = require('@payos/node');
const crypto = require('crypto');

class PayOSService {
  constructor() {
    this.payOS = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    );
    
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PAYOS_PRODUCTION_URL 
      : process.env.PAYOS_SANDBOX_URL;
  }

  /**
   * Create PayOS payment link
   */
  async createPaymentLink(paymentData) {
    try {
      const {
        appointmentId,
        amount,
        description,
        serviceName,
        patientInfo,
        returnUrl,
        cancelUrl
      } = paymentData;

      // Generate unique order code
      const orderCode = this.generateOrderCode();

      // Prepare payment request
      const paymentRequest = {
        orderCode: orderCode,
        amount: amount,
        description: description || `Thanh toán khám bệnh - ${appointmentId}`,
        items: [
          {
            name: serviceName || 'Phí khám bệnh',
            quantity: 1,
            price: amount
          }
        ],
        returnUrl: returnUrl || `${process.env.FRONTEND_URL}/patient/payment/result`,
        cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/patient/payment/checkout`,
        buyerName: patientInfo?.patientName || 'Bệnh nhân',
        buyerEmail: patientInfo?.email || '',
        buyerPhone: patientInfo?.phone || '',
        buyerAddress: patientInfo?.address || '',
        expiredAt: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
      };

      console.log('Creating PayOS payment with data:', paymentRequest);

      // Create payment link
      const paymentLinkResponse = await this.payOS.createPaymentLink(paymentRequest);

      console.log('PayOS response:', paymentLinkResponse);

      return {
        success: true,
        data: {
          orderCode: orderCode,
          checkoutUrl: paymentLinkResponse.checkoutUrl,
          qrCode: paymentLinkResponse.qrCode,
          amount: amount,
          description: description,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
      };

    } catch (error) {
      console.error('PayOS create payment error:', error);
      return {
        success: false,
        message: error.message || 'Lỗi tạo thanh toán PayOS',
        error: error
      };
    }
  }

  /**
   * Get payment information
   */
  async getPaymentInfo(orderCode) {
    try {
      const paymentInfo = await this.payOS.getPaymentLinkInformation(orderCode);
      
      return {
        success: true,
        data: {
          orderCode: paymentInfo.orderCode,
          amount: paymentInfo.amount,
          status: this.mapPayOSStatus(paymentInfo.status),
          description: paymentInfo.description,
          createdAt: paymentInfo.createdAt,
          transactions: paymentInfo.transactions || []
        }
      };

    } catch (error) {
      console.error('PayOS get payment info error:', error);
      return {
        success: false,
        message: error.message || 'Lỗi lấy thông tin thanh toán',
        error: error
      };
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(orderCode, reason = 'Hủy thanh toán') {
    try {
      const cancelResponse = await this.payOS.cancelPaymentLink(orderCode, reason);
      
      return {
        success: true,
        data: {
          orderCode: orderCode,
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
          reason: reason
        }
      };

    } catch (error) {
      console.error('PayOS cancel payment error:', error);
      return {
        success: false,
        message: error.message || 'Lỗi hủy thanh toán',
        error: error
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(webhookBody, signature) {
    try {
      const computedSignature = crypto
        .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
        .update(JSON.stringify(webhookBody))
        .digest('hex');

      return computedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook data
   */
  async processWebhook(webhookData) {
    try {
      const {
        orderCode,
        amount,
        description,
        accountNumber,
        reference,
        transactionDateTime,
        currency,
        paymentLinkId,
        code,
        desc
      } = webhookData;

      // Determine payment status based on webhook data
      let status = 'pending';
      if (code === '00') {
        status = 'success';
      } else if (code === '01') {
        status = 'failed';
      }

      return {
        success: true,
        data: {
          orderCode,
          amount,
          status,
          transactionId: reference,
          paymentMethod: 'payos',
          description,
          paidAt: transactionDateTime,
          payosData: webhookData
        }
      };

    } catch (error) {
      console.error('Process webhook error:', error);
      return {
        success: false,
        message: error.message || 'Lỗi xử lý webhook',
        error: error
      };
    }
  }

  /**
   * Generate unique order code
   */
  generateOrderCode() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return parseInt(`${timestamp}${random}`.slice(-10)); // PayOS requires numeric order code
  }

  /**
   * Map PayOS status to our internal status
   */
  mapPayOSStatus(payosStatus) {
    const statusMap = {
      'PENDING': 'pending',
      'PROCESSING': 'pending',
      'PAID': 'success',
      'CANCELLED': 'cancelled',
      'EXPIRED': 'failed'
    };

    return statusMap[payosStatus] || 'pending';
  }

  /**
   * Validate payment amount
   */
  validateAmount(amount) {
    // PayOS minimum: 1,000 VND, maximum: 500,000,000 VND
    return amount >= 1000 && amount <= 500000000;
  }

  /**
   * Format amount for PayOS (must be integer)
   */
  formatAmount(amount) {
    return Math.round(amount);
  }

  /**
   * Create payment signature for verification
   */
  createPaymentSignature(data) {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Get payment methods supported by PayOS
   */
  getSupportedPaymentMethods() {
    return [
      {
        id: 'bank_transfer',
        name: 'Chuyển khoản ngân hàng',
        description: 'Chuyển khoản qua QR Code hoặc số tài khoản',
        icon: 'bank'
      },
      {
        id: 'e_wallet',
        name: 'Ví điện tử',
        description: 'Thanh toán qua các ví điện tử phổ biến',
        icon: 'wallet'
      },
      {
        id: 'credit_card',
        name: 'Thẻ tín dụng/ghi nợ',
        description: 'Thanh toán bằng thẻ Visa, Mastercard',
        icon: 'card'
      }
    ];
  }

  /**
   * Get transaction fee information
   */
  getTransactionFee(amount, paymentMethod = 'bank_transfer') {
    // PayOS fee structure (example - check actual rates)
    const feeRates = {
      'bank_transfer': 0.005, // 0.5%
      'e_wallet': 0.01,       // 1%
      'credit_card': 0.025    // 2.5%
    };

    const rate = feeRates[paymentMethod] || feeRates['bank_transfer'];
    const fee = Math.round(amount * rate);
    const minFee = 1000; // Minimum fee 1,000 VND

    return Math.max(fee, minFee);
  }
}

module.exports = PayOSService;
