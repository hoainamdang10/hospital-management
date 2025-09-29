/**
 * BillingAggregate Unit Tests
 * Tests for billing domain aggregate logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest Testing, Domain Logic Testing, Vietnamese Healthcare
 */

import { BillingAggregate } from '../../../src/domain/aggregates/BillingAggregate';
import { InvoiceId } from '../../../src/domain/value-objects/InvoiceId';
import { Money } from '../../../src/domain/value-objects/Money';
import { Insurance } from '../../../src/domain/value-objects/Insurance';

describe('BillingAggregate', () => {
  let billingAggregate: BillingAggregate;
  let invoiceId: InvoiceId;
  let mockInsurance: Insurance;

  beforeEach(() => {
    invoiceId = InvoiceId.create();
    mockInsurance = Insurance.create({
      type: 'BHYT',
      policyNumber: 'HS1234567890123',
      beneficiaryName: 'Nguyễn Văn A',
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31'),
      region: '01',
      coverageLevel: 0.8
    });

    billingAggregate = BillingAggregate.create({
      invoiceId: invoiceId.getValue(),
      patientId: 'PAT-202412-001',
      doctorId: 'CARD-DOC-202412-001',
      medicalRecordId: 'MR-202412-001',
      appointmentId: 'APT-202412-001',
      insurance: mockInsurance,
      notes: 'Test billing aggregate'
    });
  });

  describe('Creation', () => {
    it('should create billing aggregate with valid data', () => {
      expect(billingAggregate).toBeDefined();
      expect(billingAggregate.getInvoiceId()).toBe(invoiceId.getValue());
      expect(billingAggregate.getPatientId()).toBe('PAT-202412-001');
      expect(billingAggregate.getStatus()).toBe('DRAFT');
      expect(billingAggregate.getItems()).toHaveLength(0);
    });

    it('should throw error when creating with invalid patient ID', () => {
      expect(() => {
        BillingAggregate.create({
          invoiceId: invoiceId.getValue(),
          patientId: 'INVALID-ID',
          doctorId: 'CARD-DOC-202412-001'
        });
      }).toThrow('Mã bệnh nhân không đúng định dạng');
    });

    it('should throw error when creating with invalid doctor ID', () => {
      expect(() => {
        BillingAggregate.create({
          invoiceId: invoiceId.getValue(),
          patientId: 'PAT-202412-001',
          doctorId: 'INVALID-DOC-ID'
        });
      }).toThrow('Mã bác sĩ không đúng định dạng');
    });
  });

  describe('Adding Billing Items', () => {
    it('should add billing item successfully', () => {
      const item = {
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 200000,
        category: 'CONSULTATION' as const,
        description: 'Khám sức khỏe tổng quát'
      };

      billingAggregate.addItem(item);

      const items = billingAggregate.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].serviceCode).toBe('CONS001');
      expect(items[0].serviceName).toBe('Khám tổng quát');
      expect(items[0].totalAmount).toBe(200000);
    });

    it('should calculate correct total amount for multiple items', () => {
      const items = [
        {
          serviceCode: 'CONS001',
          serviceName: 'Khám tổng quát',
          quantity: 1,
          unitPrice: 200000,
          category: 'CONSULTATION' as const
        },
        {
          serviceCode: 'DIAG001',
          serviceName: 'Xét nghiệm máu',
          quantity: 2,
          unitPrice: 150000,
          category: 'DIAGNOSTIC' as const
        }
      ];

      items.forEach(item => billingAggregate.addItem(item));

      expect(billingAggregate.getSubtotal()).toBe(500000); // 200000 + (2 * 150000)
    });

    it('should throw error when adding item with invalid service code', () => {
      const item = {
        serviceCode: '',
        serviceName: 'Test Service',
        quantity: 1,
        unitPrice: 100000,
        category: 'CONSULTATION' as const
      };

      expect(() => {
        billingAggregate.addItem(item);
      }).toThrow('Mã dịch vụ không được để trống');
    });

    it('should throw error when adding item with zero quantity', () => {
      const item = {
        serviceCode: 'CONS001',
        serviceName: 'Test Service',
        quantity: 0,
        unitPrice: 100000,
        category: 'CONSULTATION' as const
      };

      expect(() => {
        billingAggregate.addItem(item);
      }).toThrow('Số lượng phải lớn hơn 0');
    });

    it('should throw error when adding item with negative price', () => {
      const item = {
        serviceCode: 'CONS001',
        serviceName: 'Test Service',
        quantity: 1,
        unitPrice: -100000,
        category: 'CONSULTATION' as const
      };

      expect(() => {
        billingAggregate.addItem(item);
      }).toThrow('Đơn giá phải lớn hơn 0');
    });
  });

  describe('Tax Calculations', () => {
    beforeEach(() => {
      billingAggregate.addItem({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 1000000, // 1,000,000 VND
        category: 'CONSULTATION' as const
      });
    });

    it('should calculate 10% VAT correctly', () => {
      const taxAmount = billingAggregate.getTaxAmount();
      expect(taxAmount).toBe(100000); // 10% of 1,000,000
    });

    it('should calculate total amount including tax', () => {
      const totalAmount = billingAggregate.getTotalAmount();
      expect(totalAmount).toBe(1100000); // 1,000,000 + 100,000 tax
    });
  });

  describe('Insurance Coverage', () => {
    beforeEach(() => {
      billingAggregate.addItem({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 1000000,
        category: 'CONSULTATION' as const
      });
    });

    it('should calculate BHYT coverage correctly', () => {
      const coverage = billingAggregate.getInsuranceCoverage();
      // BHYT covers 80% of subtotal (before tax)
      expect(coverage).toBe(800000); // 80% of 1,000,000
    });

    it('should calculate patient payment after insurance', () => {
      const patientPayment = billingAggregate.getPatientPayment();
      // Total: 1,100,000, Insurance covers: 800,000, Patient pays: 300,000
      expect(patientPayment).toBe(300000);
    });

    it('should handle no insurance case', () => {
      const billingWithoutInsurance = BillingAggregate.create({
        invoiceId: InvoiceId.create().getValue(),
        patientId: 'PAT-202412-002',
        doctorId: 'CARD-DOC-202412-001'
      });

      billingWithoutInsurance.addItem({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 1000000,
        category: 'CONSULTATION' as const
      });

      expect(billingWithoutInsurance.getInsuranceCoverage()).toBe(0);
      expect(billingWithoutInsurance.getPatientPayment()).toBe(1100000); // Full amount
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      billingAggregate.addItem({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 1000000,
        category: 'CONSULTATION' as const
      });
      billingAggregate.finalize();
    });

    it('should process cash payment successfully', () => {
      const paymentAmount = billingAggregate.getPatientPayment();
      
      billingAggregate.processPayment({
        paymentMethod: 'CASH',
        amount: paymentAmount,
        currency: 'VND',
        transactionId: 'CASH-001',
        processedAt: new Date()
      });

      expect(billingAggregate.getStatus()).toBe('PAID');
      expect(billingAggregate.getPayments()).toHaveLength(1);
    });

    it('should process PayOS payment successfully', () => {
      const paymentAmount = billingAggregate.getPatientPayment();
      
      billingAggregate.processPayment({
        paymentMethod: 'PAYOS',
        amount: paymentAmount,
        currency: 'VND',
        transactionId: 'PAYOS-12345',
        paymentLink: 'https://payos.vn/payment/12345',
        processedAt: new Date()
      });

      expect(billingAggregate.getStatus()).toBe('PAID');
      expect(billingAggregate.getPayments()[0].paymentMethod).toBe('PAYOS');
    });

    it('should handle partial payment', () => {
      const partialAmount = billingAggregate.getPatientPayment() / 2;
      
      billingAggregate.processPayment({
        paymentMethod: 'CASH',
        amount: partialAmount,
        currency: 'VND',
        transactionId: 'CASH-001',
        processedAt: new Date()
      });

      expect(billingAggregate.getStatus()).toBe('PARTIALLY_PAID');
      expect(billingAggregate.getRemainingAmount()).toBe(partialAmount);
    });

    it('should throw error when processing payment on draft invoice', () => {
      const draftBilling = BillingAggregate.create({
        invoiceId: InvoiceId.create().getValue(),
        patientId: 'PAT-202412-003',
        doctorId: 'CARD-DOC-202412-001'
      });

      expect(() => {
        draftBilling.processPayment({
          paymentMethod: 'CASH',
          amount: 100000,
          currency: 'VND',
          transactionId: 'CASH-001',
          processedAt: new Date()
        });
      }).toThrow('Không thể thanh toán hóa đơn chưa được hoàn thiện');
    });
  });

  describe('Status Management', () => {
    it('should start with DRAFT status', () => {
      expect(billingAggregate.getStatus()).toBe('DRAFT');
    });

    it('should change to FINALIZED when finalized', () => {
      billingAggregate.addItem({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 200000,
        category: 'CONSULTATION' as const
      });

      billingAggregate.finalize();
      expect(billingAggregate.getStatus()).toBe('FINALIZED');
    });

    it('should throw error when finalizing empty invoice', () => {
      expect(() => {
        billingAggregate.finalize();
      }).toThrow('Không thể hoàn thiện hóa đơn không có dịch vụ');
    });

    it('should change to CANCELLED when cancelled', () => {
      billingAggregate.cancel('Hủy theo yêu cầu bệnh nhân');
      expect(billingAggregate.getStatus()).toBe('CANCELLED');
    });

    it('should throw error when cancelling paid invoice', () => {
      billingAggregate.addItem({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 200000,
        category: 'CONSULTATION' as const
      });
      
      billingAggregate.finalize();
      billingAggregate.processPayment({
        paymentMethod: 'CASH',
        amount: billingAggregate.getPatientPayment(),
        currency: 'VND',
        transactionId: 'CASH-001',
        processedAt: new Date()
      });

      expect(() => {
        billingAggregate.cancel('Test cancellation');
      }).toThrow('Không thể hủy hóa đơn đã thanh toán');
    });
  });

  describe('Vietnamese Summary Generation', () => {
    beforeEach(() => {
      billingAggregate.addItem({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 500000,
        category: 'CONSULTATION' as const
      });

      billingAggregate.addItem({
        serviceCode: 'DIAG001',
        serviceName: 'Xét nghiệm máu',
        quantity: 2,
        unitPrice: 200000,
        category: 'DIAGNOSTIC' as const
      });
    });

    it('should generate Vietnamese summary correctly', () => {
      const summary = billingAggregate.generateVietnameseSummary();
      
      expect(summary).toContain('Khám tổng quát');
      expect(summary).toContain('Xét nghiệm máu');
      expect(summary).toContain('500.000 VND');
      expect(summary).toContain('400.000 VND');
      expect(summary).toContain('Tổng cộng');
    });

    it('should include insurance information in summary', () => {
      const summary = billingAggregate.generateVietnameseSummary();
      
      expect(summary).toContain('BHYT');
      expect(summary).toContain('80%');
      expect(summary).toContain('Bệnh nhân thanh toán');
    });
  });

  describe('Domain Events', () => {
    it('should raise InvoiceCreatedEvent when created', () => {
      const events = billingAggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].getEventName()).toBe('InvoiceCreatedEvent');
    });

    it('should raise InvoiceUpdatedEvent when item added', () => {
      billingAggregate.clearEvents(); // Clear creation event
      
      billingAggregate.addItem({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 200000,
        category: 'CONSULTATION' as const
      });

      const events = billingAggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].getEventName()).toBe('InvoiceUpdatedEvent');
    });

    it('should raise PaymentProcessedEvent when payment processed', () => {
      billingAggregate.addItem({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 200000,
        category: 'CONSULTATION' as const
      });
      
      billingAggregate.finalize();
      billingAggregate.clearEvents(); // Clear previous events
      
      billingAggregate.processPayment({
        paymentMethod: 'CASH',
        amount: billingAggregate.getPatientPayment(),
        currency: 'VND',
        transactionId: 'CASH-001',
        processedAt: new Date()
      });

      const events = billingAggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].getEventName()).toBe('PaymentProcessedEvent');
    });
  });
});
