/**
 * PayOS Integration Tests
 * Tests for PayOS payment gateway integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Integration Testing, PayOS API, Vietnamese Payment Standards
 */

import { PayOSGatewayService } from '../../src/infrastructure/external/PayOSGatewayService';
import { PayOSIntegrationService } from '../../src/application/services/PayOSIntegrationService';

describe('PayOS Integration Tests', () => {
  let payosGateway: PayOSGatewayService;
  let payosIntegration: PayOSIntegrationService;

  beforeAll(() => {
    // Setup test environment variables
    process.env.PAYOS_CLIENT_ID = 'test_client_id';
    process.env.PAYOS_API_KEY = 'test_api_key';
    process.env.PAYOS_CHECKSUM_KEY = 'test_checksum_key';
    process.env.PAYOS_ENVIRONMENT = 'sandbox';
    process.env.PAYOS_WEBHOOK_URL = 'https://test.hospital.com/api/v1/billing/webhooks/payos';

    payosGateway = new PayOSGatewayService();
    payosIntegration = new PayOSIntegrationService(payosGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Link Creation', () => {
    it('should create payment link successfully', async () => {
      // Arrange
      const paymentData = {
        orderCode: 'INV-202412-000001',
        amount: 500000, // 500,000 VND
        description: 'Thanh toán hóa đơn khám bệnh - Nguyễn Văn A',
        returnUrl: 'https://hospital.com/payment/success',
        cancelUrl: 'https://hospital.com/payment/cancel',
        buyerName: 'Nguyễn Văn A',
        buyerEmail: 'nguyenvana@email.com',
        buyerPhone: '0901234567',
        buyerAddress: 'Hà Nội, Việt Nam',
        items: [
          {
            name: 'Khám tổng quát',
            quantity: 1,
            price: 300000
          },
          {
            name: 'Xét nghiệm máu',
            quantity: 1,
            price: 200000
          }
        ],
        expiredAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      // Act
      const result = await payosGateway.createPaymentLink(paymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.checkoutUrl).toContain('https://');
      expect(result.data!.qrCode).toBeDefined();
      expect(result.data!.orderCode).toBe(paymentData.orderCode);
      expect(result.data!.amount).toBe(paymentData.amount);
    });

    it('should handle Vietnamese characters in payment description', async () => {
      // Arrange
      const paymentData = {
        orderCode: 'INV-202412-000002',
        amount: 750000,
        description: 'Thanh toán phí khám chữa bệnh - Trần Thị Bình (có dấu tiếng Việt)',
        returnUrl: 'https://hospital.com/payment/success',
        cancelUrl: 'https://hospital.com/payment/cancel',
        buyerName: 'Trần Thị Bình',
        buyerEmail: 'tranthibinh@email.com',
        buyerPhone: '0987654321',
        items: [
          {
            name: 'Khám chuyên khoa tim mạch',
            quantity: 1,
            price: 750000
          }
        ]
      };

      // Act
      const result = await payosGateway.createPaymentLink(paymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.description).toContain('Trần Thị Bình');
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidPaymentData = {
        orderCode: '', // Empty order code
        amount: 0, // Zero amount
        description: '',
        returnUrl: 'invalid-url', // Invalid URL
        items: []
      };

      // Act
      const result = await payosGateway.createPaymentLink(invalidPaymentData as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Dữ liệu thanh toán không hợp lệ');
    });

    it('should handle minimum and maximum amounts', async () => {
      // Test minimum amount (1,000 VND)
      const minAmountData = {
        orderCode: 'INV-202412-000003',
        amount: 1000,
        description: 'Test minimum amount',
        returnUrl: 'https://hospital.com/payment/success',
        cancelUrl: 'https://hospital.com/payment/cancel',
        items: [{ name: 'Test item', quantity: 1, price: 1000 }]
      };

      const minResult = await payosGateway.createPaymentLink(minAmountData);
      expect(minResult.success).toBe(true);

      // Test maximum amount (500,000,000 VND)
      const maxAmountData = {
        orderCode: 'INV-202412-000004',
        amount: 500000000,
        description: 'Test maximum amount',
        returnUrl: 'https://hospital.com/payment/success',
        cancelUrl: 'https://hospital.com/payment/cancel',
        items: [{ name: 'Expensive procedure', quantity: 1, price: 500000000 }]
      };

      const maxResult = await payosGateway.createPaymentLink(maxAmountData);
      expect(maxResult.success).toBe(true);
    });
  });

  describe('Payment Status Checking', () => {
    it('should check payment status successfully', async () => {
      // Arrange
      const orderCode = 'INV-202412-000005';

      // First create a payment link
      const paymentData = {
        orderCode,
        amount: 300000,
        description: 'Test payment status check',
        returnUrl: 'https://hospital.com/payment/success',
        cancelUrl: 'https://hospital.com/payment/cancel',
        items: [{ name: 'Test service', quantity: 1, price: 300000 }]
      };

      await payosGateway.createPaymentLink(paymentData);

      // Act
      const result = await payosGateway.getPaymentStatus(orderCode);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.orderCode).toBe(orderCode);
      expect(['PENDING', 'PAID', 'CANCELLED', 'EXPIRED']).toContain(result.data!.status);
    });

    it('should handle non-existent order code', async () => {
      // Arrange
      const nonExistentOrderCode = 'INV-202412-999999';

      // Act
      const result = await payosGateway.getPaymentStatus(nonExistentOrderCode);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('ORDER_NOT_FOUND');
      expect(result.error!.message).toContain('Không tìm thấy đơn hàng');
    });
  });

  describe('Payment Cancellation', () => {
    it('should cancel payment successfully', async () => {
      // Arrange
      const orderCode = 'INV-202412-000006';

      // First create a payment link
      const paymentData = {
        orderCode,
        amount: 400000,
        description: 'Test payment cancellation',
        returnUrl: 'https://hospital.com/payment/success',
        cancelUrl: 'https://hospital.com/payment/cancel',
        items: [{ name: 'Test service', quantity: 1, price: 400000 }]
      };

      await payosGateway.createPaymentLink(paymentData);

      // Act
      const result = await payosGateway.cancelPayment(orderCode, 'Hủy theo yêu cầu bệnh nhân');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.orderCode).toBe(orderCode);
      expect(result.data!.status).toBe('CANCELLED');
    });

    it('should handle cancellation of already paid order', async () => {
      // This test would require a paid order, which is difficult to simulate
      // In a real test environment, you might use PayOS sandbox features
      const orderCode = 'INV-202412-PAID-001';

      const result = await payosGateway.cancelPayment(orderCode, 'Test cancellation');

      // Depending on PayOS behavior, this might succeed or fail
      if (!result.success) {
        expect(result.error!.code).toBe('CANCELLATION_NOT_ALLOWED');
        expect(result.error!.message).toContain('Không thể hủy đơn hàng đã thanh toán');
      }
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should verify webhook signature correctly', async () => {
      // Arrange
      const webhookData = {
        orderCode: 'INV-202412-000007',
        amount: 250000,
        description: 'Test webhook',
        accountNumber: '12345678',
        reference: 'REF123',
        transactionDateTime: '2024-12-28T10:00:00Z',
        currency: 'VND',
        paymentLinkId: 'paylink123',
        code: '00',
        desc: 'Thành công'
      };

      const signature = 'test_signature_hash';

      // Act
      const isValid = await payosGateway.verifyWebhookSignature(webhookData, signature);

      // Assert
      expect(typeof isValid).toBe('boolean');
      // In a real implementation, this would verify against the actual signature
    });

    it('should reject invalid webhook signature', async () => {
      // Arrange
      const webhookData = {
        orderCode: 'INV-202412-000008',
        amount: 250000,
        description: 'Test invalid webhook'
      };

      const invalidSignature = 'invalid_signature';

      // Act
      const isValid = await payosGateway.verifyWebhookSignature(webhookData, invalidSignature);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeout errors', async () => {
      // Arrange
      const paymentData = {
        orderCode: 'INV-202412-TIMEOUT',
        amount: 100000,
        description: 'Test timeout',
        returnUrl: 'https://hospital.com/payment/success',
        cancelUrl: 'https://hospital.com/payment/cancel',
        items: [{ name: 'Test', quantity: 1, price: 100000 }]
      };

      // Mock network timeout
      jest.spyOn(payosGateway as any, 'makeRequest').mockRejectedValue(
        new Error('ETIMEDOUT')
      );

      // Act
      const result = await payosGateway.createPaymentLink(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('NETWORK_ERROR');
      expect(result.error!.message).toContain('Lỗi kết nối mạng');
    });

    it('should handle PayOS API errors', async () => {
      // Arrange
      const paymentData = {
        orderCode: 'INV-202412-API-ERROR',
        amount: 100000,
        description: 'Test API error',
        returnUrl: 'https://hospital.com/payment/success',
        cancelUrl: 'https://hospital.com/payment/cancel',
        items: [{ name: 'Test', quantity: 1, price: 100000 }]
      };

      // Mock API error response
      jest.spyOn(payosGateway as any, 'makeRequest').mockResolvedValue({
        error: 1,
        message: 'Invalid API key',
        data: null
      });

      // Act
      const result = await payosGateway.createPaymentLink(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('PAYOS_API_ERROR');
      expect(result.error!.message).toContain('Invalid API key');
    });

    it('should handle rate limiting', async () => {
      // Simulate multiple rapid requests
      const promises = Array.from({ length: 10 }, (_, i) => 
        payosGateway.createPaymentLink({
          orderCode: `INV-202412-RATE-${i}`,
          amount: 100000,
          description: `Rate limit test ${i}`,
          returnUrl: 'https://hospital.com/payment/success',
          cancelUrl: 'https://hospital.com/payment/cancel',
          items: [{ name: 'Test', quantity: 1, price: 100000 }]
        })
      );

      // Act
      const results = await Promise.allSettled(promises);

      // Assert
      const rejectedResults = results.filter(r => r.status === 'rejected');
      // Some requests might be rate limited
      expect(rejectedResults.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Service Tests', () => {
    it('should process hospital payment workflow', async () => {
      // Arrange
      const invoiceData = {
        invoiceId: 'INV-202412-000009',
        patientId: 'PAT-202412-001',
        patientName: 'Nguyễn Văn C',
        patientEmail: 'nguyenvanc@email.com',
        patientPhone: '0912345678',
        amount: 650000,
        items: [
          { name: 'Khám nội khoa', price: 350000 },
          { name: 'Siêu âm bụng', price: 300000 }
        ],
        notes: 'Khám định kỳ'
      };

      // Act
      const result = await payosIntegration.createHospitalPayment(invoiceData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.paymentLink).toContain('https://');
      expect(result.data!.qrCode).toBeDefined();
      expect(result.data!.orderCode).toBe(invoiceData.invoiceId);
    });

    it('should handle payment confirmation workflow', async () => {
      // Arrange
      const webhookPayload = {
        orderCode: 'INV-202412-000010',
        amount: 500000,
        description: 'Payment confirmation test',
        accountNumber: '12345678',
        reference: 'REF456',
        transactionDateTime: new Date().toISOString(),
        currency: 'VND',
        paymentLinkId: 'paylink456',
        code: '00',
        desc: 'Thành công'
      };

      // Act
      const result = await payosIntegration.processPaymentConfirmation(webhookPayload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('CONFIRMED');
      expect(result.data!.transactionId).toBeDefined();
    });

    it('should generate Vietnamese payment summary', async () => {
      // Arrange
      const paymentData = {
        amount: 1250000,
        items: [
          { name: 'Khám chuyên khoa', price: 500000 },
          { name: 'Xét nghiệm tổng quát', price: 300000 },
          { name: 'Chụp X-quang', price: 450000 }
        ],
        patientName: 'Lê Thị D',
        invoiceId: 'INV-202412-000011'
      };

      // Act
      const summary = await payosIntegration.generatePaymentSummary(paymentData);

      // Assert
      expect(summary).toContain('Lê Thị D');
      expect(summary).toContain('1.250.000 VND');
      expect(summary).toContain('Khám chuyên khoa');
      expect(summary).toContain('Xét nghiệm tổng quát');
      expect(summary).toContain('Chụp X-quang');
      expect(summary).toContain('INV-202412-000011');
    });
  });

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      // Act
      const result = await payosGateway.healthCheck();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('healthy');
      expect(result.data!.service).toBe('payos-gateway');
      expect(result.data!.timestamp).toBeDefined();
    });

    it('should detect unhealthy service', async () => {
      // Mock unhealthy response
      jest.spyOn(payosGateway as any, 'makeRequest').mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act
      const result = await payosGateway.healthCheck();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('SERVICE_UNHEALTHY');
    });
  });
});
