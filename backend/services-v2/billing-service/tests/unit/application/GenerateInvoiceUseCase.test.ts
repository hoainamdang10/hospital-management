/**
 * GenerateInvoiceUseCase Unit Tests
 * Tests for invoice generation use case logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest Testing, Use Case Testing, Vietnamese Healthcare
 */

import { GenerateInvoiceUseCase } from '../../../src/application/use-cases/GenerateInvoiceUseCase';
import { GenerateInvoiceCommand } from '../../../src/application/commands/GenerateInvoiceCommand';
import { IBillingRepository } from '../../../src/domain/repositories/IBillingRepository';
import { BillingAggregate } from '../../../src/domain/aggregates/BillingAggregate';
import { InvoiceId } from '../../../src/domain/value-objects/InvoiceId';

// Mock repository
const mockBillingRepository: jest.Mocked<IBillingRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByPatientId: jest.fn(),
  findByDoctorId: jest.fn(),
  findByMedicalRecordId: jest.fn(),
  findByAppointmentId: jest.fn(),
  findByStatus: jest.fn(),
  findByDateRange: jest.fn(),
  findOverdueInvoices: jest.fn(),
  findByInsuranceType: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('GenerateInvoiceUseCase', () => {
  let useCase: GenerateInvoiceUseCase;
  let mockCommand: GenerateInvoiceCommand;

  beforeEach(() => {
    useCase = new GenerateInvoiceUseCase(mockBillingRepository);
    
    mockCommand = new GenerateInvoiceCommand({
      patientId: 'PAT-202412-001',
      doctorId: 'CARD-DOC-202412-001',
      medicalRecordId: 'MR-202412-001',
      appointmentId: 'APT-202412-001',
      items: [
        {
          serviceCode: 'CONS001',
          serviceName: 'Khám tổng quát',
          quantity: 1,
          unitPrice: 500000,
          category: 'CONSULTATION',
          description: 'Khám sức khỏe tổng quát'
        },
        {
          serviceCode: 'DIAG001',
          serviceName: 'Xét nghiệm máu',
          quantity: 2,
          unitPrice: 200000,
          category: 'DIAGNOSTIC',
          description: 'Xét nghiệm máu cơ bản'
        }
      ],
      insurance: {
        type: 'BHYT',
        policyNumber: 'HS1234567890123',
        beneficiaryName: 'Nguyễn Văn A',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        region: '01',
        coverageLevel: 0.8
      },
      notes: 'Hóa đơn khám bệnh định kỳ',
      correlationId: 'test-correlation-001'
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Successful Invoice Generation', () => {
    it('should generate invoice successfully with valid data', async () => {
      // Arrange
      mockBillingRepository.findByMedicalRecordId.mockResolvedValue(null);
      mockBillingRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(mockCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.patientId).toBe('PAT-202412-001');
      expect(result.data!.items).toHaveLength(2);
      expect(result.data!.subtotal).toBe(900000); // 500000 + (2 * 200000)
      expect(result.data!.taxAmount).toBe(90000); // 10% VAT
      expect(result.data!.totalAmount).toBe(990000);
      expect(result.data!.insuranceCoverage).toBe(720000); // 80% of subtotal
      expect(result.data!.patientPayment).toBe(270000); // Total - Insurance coverage
      expect(result.data!.status).toBe('FINALIZED');

      // Verify repository calls
      expect(mockBillingRepository.findByMedicalRecordId).toHaveBeenCalledWith('MR-202412-001');
      expect(mockBillingRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should generate invoice without insurance', async () => {
      // Arrange
      const commandWithoutInsurance = new GenerateInvoiceCommand({
        patientId: 'PAT-202412-002',
        doctorId: 'CARD-DOC-202412-001',
        items: [
          {
            serviceCode: 'CONS001',
            serviceName: 'Khám tổng quát',
            quantity: 1,
            unitPrice: 500000,
            category: 'CONSULTATION'
          }
        ],
        correlationId: 'test-correlation-002'
      });

      mockBillingRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(commandWithoutInsurance);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.insuranceCoverage).toBe(0);
      expect(result.data!.patientPayment).toBe(550000); // 500000 + 50000 tax
    });

    it('should generate Vietnamese summary correctly', async () => {
      // Arrange
      mockBillingRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(mockCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.summary).toContain('Khám tổng quát');
      expect(result.data!.summary).toContain('Xét nghiệm máu');
      expect(result.data!.summary).toContain('BHYT');
      expect(result.data!.summary).toContain('500.000 VND');
    });
  });

  describe('Validation Errors', () => {
    it('should fail with invalid patient ID format', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        patientId: 'INVALID-ID'
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Mã bệnh nhân không đúng định dạng');
    });

    it('should fail with invalid doctor ID format', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        doctorId: 'INVALID-DOC-ID'
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Mã bác sĩ không đúng định dạng');
    });

    it('should fail with empty items array', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        items: []
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Danh sách dịch vụ không được để trống');
    });

    it('should fail with invalid service code', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        items: [
          {
            serviceCode: '', // Invalid empty service code
            serviceName: 'Test Service',
            quantity: 1,
            unitPrice: 100000,
            category: 'CONSULTATION'
          }
        ]
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Mã dịch vụ không được để trống');
    });

    it('should fail with zero quantity', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        items: [
          {
            serviceCode: 'CONS001',
            serviceName: 'Test Service',
            quantity: 0, // Invalid zero quantity
            unitPrice: 100000,
            category: 'CONSULTATION'
          }
        ]
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Số lượng phải lớn hơn 0');
    });

    it('should fail with negative unit price', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        items: [
          {
            serviceCode: 'CONS001',
            serviceName: 'Test Service',
            quantity: 1,
            unitPrice: -100000, // Invalid negative price
            category: 'CONSULTATION'
          }
        ]
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Đơn giá phải lớn hơn 0');
    });
  });

  describe('Insurance Validation', () => {
    it('should fail with invalid BHYT policy number format', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        insurance: {
          type: 'BHYT',
          policyNumber: 'INVALID-BHYT', // Invalid format
          beneficiaryName: 'Nguyễn Văn A',
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2024-12-31'),
          region: '01',
          coverageLevel: 0.8
        }
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Số thẻ BHYT không đúng định dạng');
    });

    it('should fail with invalid BHTN policy number format', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        insurance: {
          type: 'BHTN',
          policyNumber: 'INVALID-BHTN', // Invalid format
          beneficiaryName: 'Nguyễn Văn A',
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2024-12-31'),
          region: '01',
          coverageLevel: 0.8
        }
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Số thẻ BHTN không đúng định dạng');
    });

    it('should fail with expired insurance', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        insurance: {
          type: 'BHYT',
          policyNumber: 'HS1234567890123',
          beneficiaryName: 'Nguyễn Văn A',
          validFrom: new Date('2023-01-01'),
          validTo: new Date('2023-12-31'), // Expired
          region: '01',
          coverageLevel: 0.8
        }
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Bảo hiểm đã hết hạn');
    });

    it('should fail with invalid coverage level', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        insurance: {
          type: 'BHYT',
          policyNumber: 'HS1234567890123',
          beneficiaryName: 'Nguyễn Văn A',
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2024-12-31'),
          region: '01',
          coverageLevel: 1.5 // Invalid > 1.0
        }
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Mức độ bao phủ phải từ 0 đến 1');
    });
  });

  describe('Business Rules', () => {
    it('should fail when duplicate invoice exists for medical record', async () => {
      // Arrange
      const existingInvoice = BillingAggregate.create({
        invoiceId: InvoiceId.create().getValue(),
        patientId: 'PAT-202412-001',
        doctorId: 'CARD-DOC-202412-001',
        medicalRecordId: 'MR-202412-001'
      });

      mockBillingRepository.findByMedicalRecordId.mockResolvedValue([existingInvoice]);

      // Act
      const result = await useCase.execute(mockCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(result.error!.message).toContain('Đã tồn tại hóa đơn cho hồ sơ y tế này');
    });

    it('should validate service category', async () => {
      // Arrange
      const invalidCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        items: [
          {
            serviceCode: 'CONS001',
            serviceName: 'Test Service',
            quantity: 1,
            unitPrice: 100000,
            category: 'INVALID_CATEGORY' as any // Invalid category
          }
        ]
      });

      // Act
      const result = await useCase.execute(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Danh mục dịch vụ không hợp lệ');
    });
  });

  describe('Repository Errors', () => {
    it('should handle repository save error', async () => {
      // Arrange
      mockBillingRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await useCase.execute(mockCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('REPOSITORY_ERROR');
      expect(result.error!.message).toContain('Lỗi lưu trữ dữ liệu');
    });

    it('should handle repository find error', async () => {
      // Arrange
      mockBillingRepository.findByMedicalRecordId.mockRejectedValue(new Error('Query timeout'));

      // Act
      const result = await useCase.execute(mockCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('REPOSITORY_ERROR');
      expect(result.error!.message).toContain('Lỗi truy vấn dữ liệu');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large amounts correctly', async () => {
      // Arrange
      const largeAmountCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        items: [
          {
            serviceCode: 'SURG001',
            serviceName: 'Phẫu thuật tim',
            quantity: 1,
            unitPrice: 500000000, // 500 million VND
            category: 'SURGERY'
          }
        ]
      });

      mockBillingRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(largeAmountCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.subtotal).toBe(500000000);
      expect(result.data!.taxAmount).toBe(50000000); // 10% VAT
      expect(result.data!.totalAmount).toBe(550000000);
    });

    it('should handle maximum number of items', async () => {
      // Arrange
      const manyItems = Array.from({ length: 50 }, (_, i) => ({
        serviceCode: `ITEM${String(i + 1).padStart(3, '0')}`,
        serviceName: `Dịch vụ ${i + 1}`,
        quantity: 1,
        unitPrice: 10000,
        category: 'OTHER' as const
      }));

      const manyItemsCommand = new GenerateInvoiceCommand({
        ...mockCommand.toPlainObject(),
        items: manyItems
      });

      mockBillingRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(manyItemsCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(50);
      expect(result.data!.subtotal).toBe(500000); // 50 * 10000
    });
  });
});
