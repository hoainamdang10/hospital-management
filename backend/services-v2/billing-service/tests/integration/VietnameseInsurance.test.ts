/**
 * Vietnamese Insurance Integration Tests
 * Tests for BHYT and BHTN insurance system integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Integration Testing, BHYT/BHTN APIs, Vietnamese Healthcare Standards
 */

import { BHYTAPIService } from '../../src/infrastructure/external/BHYTAPIService';
import { BHTNAPIService } from '../../src/infrastructure/external/BHTNAPIService';
import { ValidateInsuranceUseCase } from '../../src/application/use-cases/ValidateInsuranceUseCase';
import { ValidateInsuranceCommand } from '../../src/application/commands/ValidateInsuranceCommand';

describe('Vietnamese Insurance Integration Tests', () => {
  let bhytService: BHYTAPIService;
  let bhtnService: BHTNAPIService;
  let validateInsuranceUseCase: ValidateInsuranceUseCase;

  beforeAll(() => {
    // Setup test environment variables
    process.env.BHYT_API_URL = 'https://sandbox-bhyt.gov.vn/api';
    process.env.BHYT_API_KEY = 'test_bhyt_api_key';
    process.env.BHYT_FACILITY_CODE = 'TEST_HOSPITAL_001';
    
    process.env.BHTN_API_URL = 'https://sandbox-bhtn.gov.vn/api';
    process.env.BHTN_API_KEY = 'test_bhtn_api_key';
    process.env.BHTN_FACILITY_CODE = 'TEST_HOSPITAL_001';

    bhytService = new BHYTAPIService();
    bhtnService = new BHTNAPIService();
    
    // Mock repository for use case testing
    const mockRepository = {} as any;
    validateInsuranceUseCase = new ValidateInsuranceUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BHYT (Social Health Insurance) Integration', () => {
    describe('Card Validation', () => {
      it('should validate BHYT card successfully', async () => {
        // Arrange
        const cardData = {
          policyNumber: 'HS1234567890123',
          beneficiaryName: 'NGUYEN VAN A',
          dateOfBirth: new Date('1990-01-15'),
          region: '01', // Hà Nội
          serviceDate: new Date()
        };

        // Act
        const result = await bhytService.validateCard(cardData);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.isValid).toBe(true);
        expect(result.data!.policyNumber).toBe(cardData.policyNumber);
        expect(result.data!.beneficiaryName).toBe(cardData.beneficiaryName);
        expect(result.data!.coverageLevel).toBeGreaterThan(0);
        expect(result.data!.coverageLevel).toBeLessThanOrEqual(1);
        expect(result.data!.validFrom).toBeDefined();
        expect(result.data!.validTo).toBeDefined();
        expect(result.data!.region).toBe(cardData.region);
      });

      it('should handle invalid BHYT card number format', async () => {
        // Arrange
        const invalidCardData = {
          policyNumber: 'INVALID123', // Wrong format
          beneficiaryName: 'NGUYEN VAN B',
          dateOfBirth: new Date('1985-05-20'),
          region: '01'
        };

        // Act
        const result = await bhytService.validateCard(invalidCardData);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('INVALID_CARD_FORMAT');
        expect(result.error!.message).toContain('Số thẻ BHYT không đúng định dạng');
      });

      it('should handle expired BHYT card', async () => {
        // Arrange
        const expiredCardData = {
          policyNumber: 'HS9876543210987',
          beneficiaryName: 'TRAN THI C',
          dateOfBirth: new Date('1980-12-10'),
          region: '02', // TP.HCM
          serviceDate: new Date()
        };

        // Mock expired card response
        jest.spyOn(bhytService as any, 'makeAPIRequest').mockResolvedValue({
          success: true,
          data: {
            isValid: false,
            reason: 'EXPIRED',
            validTo: new Date('2023-12-31'), // Expired
            message: 'Thẻ BHYT đã hết hạn'
          }
        });

        // Act
        const result = await bhytService.validateCard(expiredCardData);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data!.isValid).toBe(false);
        expect(result.data!.warnings).toContain('Thẻ BHYT đã hết hạn');
      });

      it('should validate different BHYT coverage levels', async () => {
        // Test different coverage levels based on beneficiary type
        const testCases = [
          { region: '01', expectedCoverage: 0.8 }, // Hà Nội - 80%
          { region: '02', expectedCoverage: 0.8 }, // TP.HCM - 80%
          { region: '63', expectedCoverage: 0.95 }, // Rural area - 95%
        ];

        for (const testCase of testCases) {
          const cardData = {
            policyNumber: `HS123456789012${testCase.region}`,
            beneficiaryName: 'TEST BENEFICIARY',
            dateOfBirth: new Date('1990-01-01'),
            region: testCase.region
          };

          const result = await bhytService.validateCard(cardData);
          
          expect(result.success).toBe(true);
          expect(result.data!.coverageLevel).toBe(testCase.expectedCoverage);
        }
      });
    });

    describe('Claim Submission', () => {
      it('should submit BHYT claim successfully', async () => {
        // Arrange
        const claimData = {
          policyNumber: 'HS1234567890123',
          patientInfo: {
            name: 'NGUYEN VAN A',
            dateOfBirth: new Date('1990-01-15'),
            address: 'Ha Noi, Viet Nam',
            phone: '0901234567'
          },
          serviceInfo: {
            facilityCode: 'TEST_HOSPITAL_001',
            serviceDate: new Date(),
            diagnosis: 'K25.9 - Loét dạ dày, không xác định',
            services: [
              {
                code: 'CONS001',
                name: 'Khám nội khoa',
                quantity: 1,
                unitPrice: 200000,
                totalPrice: 200000
              },
              {
                code: 'DIAG001',
                name: 'Xét nghiệm máu',
                quantity: 1,
                unitPrice: 150000,
                totalPrice: 150000
              }
            ],
            totalAmount: 350000,
            claimAmount: 280000 // 80% coverage
          },
          supportingDocuments: [
            'medical_record.pdf',
            'test_results.pdf'
          ]
        };

        // Act
        const result = await bhytService.submitClaim(claimData);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.claimId).toBeDefined();
        expect(result.data!.status).toBe('SUBMITTED');
        expect(result.data!.claimAmount).toBe(280000);
        expect(result.data!.estimatedProcessingTime).toBeDefined();
      });

      it('should handle claim rejection', async () => {
        // Arrange
        const invalidClaimData = {
          policyNumber: 'HS1234567890123',
          patientInfo: {
            name: 'NGUYEN VAN A',
            dateOfBirth: new Date('1990-01-15')
          },
          serviceInfo: {
            facilityCode: 'INVALID_FACILITY',
            serviceDate: new Date(),
            services: [],
            totalAmount: 0
          }
        };

        // Act
        const result = await bhytService.submitClaim(invalidClaimData);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('CLAIM_VALIDATION_ERROR');
        expect(result.error!.message).toContain('Dữ liệu yêu cầu bồi thường không hợp lệ');
      });
    });

    describe('Claim Status Tracking', () => {
      it('should track claim status successfully', async () => {
        // Arrange
        const claimId = 'BHYT-CLAIM-202412-001';

        // Act
        const result = await bhytService.getClaimStatus(claimId);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.claimId).toBe(claimId);
        expect(['SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED', 'PAID']).toContain(result.data!.status);
        expect(result.data!.lastUpdated).toBeDefined();
      });

      it('should handle non-existent claim ID', async () => {
        // Arrange
        const nonExistentClaimId = 'BHYT-CLAIM-999999';

        // Act
        const result = await bhytService.getClaimStatus(nonExistentClaimId);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('CLAIM_NOT_FOUND');
        expect(result.error!.message).toContain('Không tìm thấy yêu cầu bồi thường');
      });
    });
  });

  describe('BHTN (Work Accident Insurance) Integration', () => {
    describe('Policy Validation', () => {
      it('should validate BHTN policy successfully', async () => {
        // Arrange
        const policyData = {
          policyNumber: 'TN1234567890123',
          beneficiaryName: 'NGUYEN VAN D',
          dateOfBirth: new Date('1985-03-20'),
          employerCode: 'EMP001',
          serviceDate: new Date()
        };

        // Act
        const result = await bhtnService.validatePolicy(policyData);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.isValid).toBe(true);
        expect(result.data!.policyNumber).toBe(policyData.policyNumber);
        expect(result.data!.beneficiaryName).toBe(policyData.beneficiaryName);
        expect(result.data!.coverageLevel).toBe(1.0); // BHTN covers 100%
        expect(result.data!.validFrom).toBeDefined();
        expect(result.data!.validTo).toBeDefined();
      });

      it('should handle invalid BHTN policy number format', async () => {
        // Arrange
        const invalidPolicyData = {
          policyNumber: 'INVALID456', // Wrong format
          beneficiaryName: 'TRAN VAN E',
          dateOfBirth: new Date('1988-07-15'),
          employerCode: 'EMP002'
        };

        // Act
        const result = await bhtnService.validatePolicy(invalidPolicyData);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('INVALID_POLICY_FORMAT');
        expect(result.error!.message).toContain('Số thẻ BHTN không đúng định dạng');
      });
    });

    describe('Accident Claim Processing', () => {
      it('should process work accident claim successfully', async () => {
        // Arrange
        const accidentClaimData = {
          policyNumber: 'TN1234567890123',
          patientInfo: {
            name: 'NGUYEN VAN D',
            dateOfBirth: new Date('1985-03-20'),
            employeeId: 'EMP001-123',
            position: 'Công nhân sản xuất'
          },
          accidentInfo: {
            accidentDate: new Date('2024-12-20'),
            accidentLocation: 'Nhà máy ABC, Hà Nội',
            accidentDescription: 'Bị thương khi vận hành máy móc',
            witnessInfo: 'Có nhân chứng: Trần Văn F',
            policeReportNumber: 'BC-2024-001'
          },
          medicalInfo: {
            facilityCode: 'TEST_HOSPITAL_001',
            admissionDate: new Date('2024-12-20'),
            diagnosis: 'S72.0 - Gãy xương đùi',
            treatment: 'Phẫu thuật nẹp xương',
            services: [
              {
                code: 'SURG001',
                name: 'Phẫu thuật nẹp xương đùi',
                quantity: 1,
                unitPrice: 15000000,
                totalPrice: 15000000
              },
              {
                code: 'HOSP001',
                name: 'Nội trú 7 ngày',
                quantity: 7,
                unitPrice: 500000,
                totalPrice: 3500000
              }
            ],
            totalAmount: 18500000,
            claimAmount: 18500000 // 100% coverage for work accident
          },
          supportingDocuments: [
            'accident_report.pdf',
            'police_report.pdf',
            'medical_records.pdf',
            'xray_images.pdf'
          ]
        };

        // Act
        const result = await bhtnService.submitAccidentClaim(accidentClaimData);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.claimId).toBeDefined();
        expect(result.data!.status).toBe('SUBMITTED');
        expect(result.data!.claimAmount).toBe(18500000);
        expect(result.data!.priority).toBe('HIGH'); // Work accidents have high priority
      });

      it('should validate accident claim requirements', async () => {
        // Arrange
        const incompleteClaimData = {
          policyNumber: 'TN1234567890123',
          patientInfo: {
            name: 'NGUYEN VAN D'
            // Missing required fields
          },
          accidentInfo: {
            // Missing accident details
          },
          medicalInfo: {
            services: [],
            totalAmount: 0
          }
        };

        // Act
        const result = await bhtnService.submitAccidentClaim(incompleteClaimData as any);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error!.code).toBe('INCOMPLETE_ACCIDENT_CLAIM');
        expect(result.error!.message).toContain('Thiếu thông tin bắt buộc cho yêu cầu bồi thường tai nạn lao động');
      });
    });

    describe('Disability Assessment', () => {
      it('should process disability assessment request', async () => {
        // Arrange
        const assessmentData = {
          claimId: 'BHTN-CLAIM-202412-001',
          patientInfo: {
            name: 'NGUYEN VAN D',
            policyNumber: 'TN1234567890123'
          },
          medicalAssessment: {
            assessmentDate: new Date(),
            assessingDoctor: 'BS. Trần Văn G',
            disabilityLevel: 25, // 25% disability
            permanentDisability: true,
            workCapacityReduction: 30, // 30% reduction
            recommendedTreatment: 'Vật lý trị liệu dài hạn',
            followUpRequired: true,
            nextAssessmentDate: new Date('2025-06-01')
          },
          supportingDocuments: [
            'disability_assessment.pdf',
            'medical_examination.pdf'
          ]
        };

        // Act
        const result = await bhtnService.submitDisabilityAssessment(assessmentData);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.assessmentId).toBeDefined();
        expect(result.data!.disabilityLevel).toBe(25);
        expect(result.data!.compensationAmount).toBeGreaterThan(0);
        expect(result.data!.monthlyAllowance).toBeGreaterThan(0);
      });
    });
  });

  describe('Use Case Integration Tests', () => {
    it('should validate BHYT insurance through use case', async () => {
      // Arrange
      const command = new ValidateInsuranceCommand({
        type: 'BHYT',
        policyNumber: 'HS1234567890123',
        beneficiaryName: 'NGUYEN VAN A',
        dateOfBirth: new Date('1990-01-15'),
        region: '01',
        serviceDate: new Date(),
        correlationId: 'test-bhyt-validation-001'
      });

      // Act
      const result = await validateInsuranceUseCase.execute(command);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isValid).toBe(true);
      expect(result.data!.coverageLevel).toBe(0.8);
      expect(result.data!.coPaymentRate).toBe(0.2);
    });

    it('should validate BHTN insurance through use case', async () => {
      // Arrange
      const command = new ValidateInsuranceCommand({
        type: 'BHTN',
        policyNumber: 'TN1234567890123',
        beneficiaryName: 'NGUYEN VAN D',
        dateOfBirth: new Date('1985-03-20'),
        serviceDate: new Date(),
        correlationId: 'test-bhtn-validation-001'
      });

      // Act
      const result = await validateInsuranceUseCase.execute(command);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isValid).toBe(true);
      expect(result.data!.coverageLevel).toBe(1.0); // 100% for BHTN
      expect(result.data!.coPaymentRate).toBe(0.0);
    });

    it('should provide Vietnamese recommendations', async () => {
      // Arrange
      const command = new ValidateInsuranceCommand({
        type: 'BHYT',
        policyNumber: 'HS1234567890123',
        beneficiaryName: 'NGUYEN VAN A',
        dateOfBirth: new Date('1990-01-15'),
        region: '01',
        serviceDate: new Date(),
        correlationId: 'test-recommendations-001'
      });

      // Act
      const result = await validateInsuranceUseCase.execute(command);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.recommendations).toBeDefined();
      expect(result.data!.recommendations.length).toBeGreaterThan(0);
      expect(result.data!.recommendations[0]).toContain('Bệnh nhân');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API timeout errors', async () => {
      // Mock timeout error
      jest.spyOn(bhytService as any, 'makeAPIRequest').mockRejectedValue(
        new Error('ETIMEDOUT')
      );

      const cardData = {
        policyNumber: 'HS1234567890123',
        beneficiaryName: 'NGUYEN VAN A',
        dateOfBirth: new Date('1990-01-15'),
        region: '01'
      };

      const result = await bhytService.validateCard(cardData);

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('API_TIMEOUT');
      expect(result.error!.message).toContain('Hết thời gian chờ kết nối API BHYT');
    });

    it('should handle service unavailable errors', async () => {
      // Mock service unavailable
      jest.spyOn(bhtnService as any, 'makeAPIRequest').mockRejectedValue(
        new Error('Service Unavailable')
      );

      const policyData = {
        policyNumber: 'TN1234567890123',
        beneficiaryName: 'NGUYEN VAN D',
        dateOfBirth: new Date('1985-03-20'),
        employerCode: 'EMP001'
      };

      const result = await bhtnService.validatePolicy(policyData);

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('SERVICE_UNAVAILABLE');
      expect(result.error!.message).toContain('Dịch vụ BHTN tạm thời không khả dụng');
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      jest.spyOn(bhytService as any, 'makeAPIRequest').mockResolvedValue({
        // Missing required fields
        data: null,
        error: undefined
      });

      const cardData = {
        policyNumber: 'HS1234567890123',
        beneficiaryName: 'NGUYEN VAN A',
        dateOfBirth: new Date('1990-01-15'),
        region: '01'
      };

      const result = await bhytService.validateCard(cardData);

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('MALFORMED_RESPONSE');
      expect(result.error!.message).toContain('Phản hồi từ API BHYT không đúng định dạng');
    });
  });

  describe('Health Checks', () => {
    it('should perform BHYT service health check', async () => {
      const result = await bhytService.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data!.service).toBe('bhyt-api');
      expect(result.data!.status).toBe('healthy');
      expect(result.data!.responseTime).toBeDefined();
    });

    it('should perform BHTN service health check', async () => {
      const result = await bhtnService.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data!.service).toBe('bhtn-api');
      expect(result.data!.status).toBe('healthy');
      expect(result.data!.responseTime).toBeDefined();
    });
  });
});
