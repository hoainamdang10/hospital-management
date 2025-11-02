/**
 * CreateTreatmentPlanUseCase Unit Tests
 * Tests for creating treatment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { CreateTreatmentPlanUseCase } from '../../../src/application/use-cases/CreateTreatmentPlanUseCase';
import {
  CreateTreatmentPlanRequest,
  CreateTreatmentPlanResponse,
} from '../../../src/application/dto/TreatmentPlanRequest';
import { ITreatmentPlanRepository } from '../../../src/domain/repositories/ITreatmentPlanRepository';
import {
  TreatmentPlanAggregate,
  TreatmentPlanStatus,
  TreatmentItemType,
  TreatmentItemStatus,
} from '../../../src/domain/aggregates/TreatmentPlan.aggregate';

describe('CreateTreatmentPlanUseCase', () => {
  let useCase: CreateTreatmentPlanUseCase;
  let mockRepository: jest.Mocked<ITreatmentPlanRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdString: jest.fn(),
      findByMedicalRecordId: jest.fn(),
      findByPatientId: jest.fn(),
      findByPrimaryDoctor: jest.fn(),
      findByStatus: jest.fn(),
      findByDateRange: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getNextSequence: jest.fn(),
    } as any;

    useCase = new CreateTreatmentPlanUseCase(mockRepository);

    // Default mock: getNextSequence returns incrementing sequence
    mockRepository.getNextSequence.mockResolvedValue(1);
  });

  describe('Basic Treatment Plan Creation', () => {
    it('should create basic treatment plan successfully', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Cao huyết áp độ 2',
        treatmentGoals: 'Kiểm soát huyết áp dưới 140/90 mmHg trong 3 tháng',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
      expect(result.planId).toMatch(/^PLAN-\d{6}-\d{3}$/);
      expect(result.patientId).toBe(request.patientId);
      expect(result.medicalRecordId).toBe(request.medicalRecordId);
      expect(result.status).toBe(TreatmentPlanStatus.PENDING_CONSENT);
      expect(result.message).toBe('Tạo kế hoạch điều trị thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create plan with patient consent', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Viêm phổi',
        treatmentGoals: 'Hồi phục hoàn toàn sau 2 tuần',
        startDate: new Date().toISOString(),
        patientConsent: true,
        consentDate: new Date().toISOString(),
        consentBy: global.testUtils.generatePatientId(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.status).toBe(TreatmentPlanStatus.ACTIVE);
    });

    it('should create plan with expected end date', async () => {
      const startDate = new Date();
      const expectedEndDate = new Date(startDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + 30);

      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Đái tháo đường type 2',
        treatmentGoals: 'Giảm HbA1c xuống dưới 7%',
        startDate: startDate.toISOString(),
        expectedEndDate: expectedEndDate.toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create plan with diagnosis code (ICD-10)', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Cao huyết áp nguyên phát',
        diagnosisCode: 'I10',
        treatmentGoals: 'Kiểm soát huyết áp',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });

    it('should create plan with detailed description', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Gãy xương đùi',
        diagnosisCode: 'S72.0',
        treatmentGoals: 'Phục hồi chức năng đi lại bình thường',
        planDescription: 'Giai đoạn 1: Phẫu thuật cố định xương\nGiai đoạn 2: Vật lý trị liệu 6 tuần\nGiai đoạn 3: Tập phục hồi chức năng',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });
  });

  describe('Treatment Plan with Consulting Doctors', () => {
    it('should create plan with consulting doctors', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Bệnh tim mạch phức tạp',
        treatmentGoals: 'Điều trị đa chuyên khoa',
        startDate: new Date().toISOString(),
        consultingDoctors: [
          global.testUtils.generateDoctorId(),
          global.testUtils.generateDoctorId(),
        ],
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });

    it('should create plan with multidisciplinary team', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Ung thư phổi giai đoạn III',
        diagnosisCode: 'C34.9',
        treatmentGoals: 'Điều trị hóa trị và xạ trị',
        consultingDoctors: [
          global.testUtils.generateDoctorId(), // Oncologist
          global.testUtils.generateDoctorId(), // Radiation oncologist
          global.testUtils.generateDoctorId(), // Surgeon
        ],
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });
  });

  describe('Treatment Plan with Initial Items', () => {
    it('should create plan with medication items', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Cao huyết áp',
        treatmentGoals: 'Kiểm soát huyết áp',
        startDate: new Date().toISOString(),
        treatmentItems: [
          {
            type: TreatmentItemType.MEDICATION,
            name: 'Amlodipine 5mg',
            frequency: '1 lần/ngày',
            duration: '3 tháng',
            instructions: 'Uống vào buổi sáng sau ăn',
          },
          {
            type: TreatmentItemType.MEDICATION,
            name: 'Losartan 50mg',
            frequency: '1 lần/ngày',
            duration: '3 tháng',
            instructions: 'Uống vào buổi tối trước khi ngủ',
          },
        ],
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });

    it('should create plan with procedure items', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Sỏi thận',
        treatmentGoals: 'Loại bỏ sỏi thận',
        startDate: new Date().toISOString(),
        treatmentItems: [
          {
            type: TreatmentItemType.SURGERY,
            name: 'Phẫu thuật nội soi lấy sỏi',
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() as any,
            instructions: 'Nhịn ăn 8 giờ trước phẫu thuật',
          },
        ],
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });

    it('should create plan with therapy items', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Đau thần kinh tọa',
        treatmentGoals: 'Giảm đau và phục hồi chức năng',
        startDate: new Date().toISOString(),
        treatmentItems: [
          {
            type: TreatmentItemType.THERAPY,
            name: 'Vật lý trị liệu',
            frequency: '3 lần/tuần',
            duration: '4 tuần',
            instructions: 'Tập với kỹ thuật viên chuyên nghiệp',
          },
          {
            type: TreatmentItemType.EXERCISE,
            name: 'Tập giãn cơ',
            frequency: '2 lần/ngày',
            duration: '6 tuần',
            instructions: 'Tập 15 phút mỗi lần',
          },
        ],
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });

    it('should create plan with mixed treatment items', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Sau phẫu thuật gãy xương đùi',
        treatmentGoals: 'Phục hồi chức năng đi lại',
        startDate: new Date().toISOString(),
        treatmentItems: [
          {
            type: TreatmentItemType.MEDICATION,
            name: 'Paracetamol 500mg',
            frequency: 'Khi đau',
            duration: '2 tuần',
            instructions: 'Không quá 4g/ngày',
          },
          {
            type: TreatmentItemType.THERAPY,
            name: 'Vật lý trị liệu',
            frequency: '3 lần/tuần',
            duration: '8 tuần',
          },
          {
            type: TreatmentItemType.LAB_TEST,
            name: 'X-quang kiểm tra xương',
            scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() as any,
          },
          {
            type: TreatmentItemType.MONITORING,
            name: 'Theo dõi liền xương',
            frequency: '1 lần/tuần',
            duration: '6 tuần',
          },
        ],
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });
  });

  describe('Specific Diagnosis Treatment Plans', () => {
    it('should create diabetes treatment plan', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Đái tháo đường type 2',
        diagnosisCode: 'E11.9',
        treatmentGoals: 'Kiểm soát đường huyết, HbA1c < 7%, giảm cân 5kg trong 6 tháng',
        planDescription: 'Điều trị kết hợp thuốc, chế độ ăn và tập luyện',
        startDate: new Date().toISOString(),
        treatmentItems: [
          {
            type: TreatmentItemType.MEDICATION,
            name: 'Metformin 500mg',
            frequency: '2 lần/ngày',
            duration: '6 tháng',
          },
          {
            type: TreatmentItemType.DIET,
            name: 'Chế độ ăn kiểm soát đường',
            frequency: 'Hàng ngày',
            duration: 'Dài hạn',
            instructions: 'Hạn chế tinh bột, đường, tăng rau xanh',
          },
          {
            type: TreatmentItemType.EXERCISE,
            name: 'Đi bộ',
            frequency: '30 phút/ngày',
            duration: 'Dài hạn',
          },
          {
            type: TreatmentItemType.MONITORING,
            name: 'Đo đường huyết',
            frequency: '2 lần/ngày',
            duration: '6 tháng',
          },
        ],
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });

    it('should create cancer treatment plan', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Ung thư vú giai đoạn II',
        diagnosisCode: 'C50.9',
        treatmentGoals: 'Loại bỏ khối u, phòng ngừa tái phát',
        planDescription: 'Phác đồ: Phẫu thuật → Hóa trị → Xạ trị',
        startDate: new Date().toISOString(),
        consultingDoctors: [
          global.testUtils.generateDoctorId(),
          global.testUtils.generateDoctorId(),
        ],
        patientConsent: true,
        consentDate: new Date().toISOString(),
        consentBy: global.testUtils.generatePatientId(),
        treatmentItems: [
          {
            type: TreatmentItemType.SURGERY,
            name: 'Phẫu thuật cắt bỏ khối u',
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() as any,
          },
          {
            type: TreatmentItemType.PROCEDURE,
            name: 'Hóa trị liệu',
            frequency: '1 chu kỳ/3 tuần',
            duration: '18 tuần',
            description: '6 chu kỳ AC-T',
          },
        ],
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.status).toBe(TreatmentPlanStatus.ACTIVE);
    });

    it('should create rehabilitation plan', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Sau tai biến mạch máu não',
        diagnosisCode: 'I64',
        treatmentGoals: 'Phục hồi vận động, ngôn ngữ',
        planDescription: 'Chương trình phục hồi chức năng toàn diện',
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        treatmentItems: [
          {
            type: TreatmentItemType.THERAPY,
            name: 'Vật lý trị liệu',
            frequency: '5 lần/tuần',
            duration: '6 tháng',
          },
          {
            type: TreatmentItemType.THERAPY,
            name: 'Trị liệu ngôn ngữ',
            frequency: '3 lần/tuần',
            duration: '6 tháng',
          },
          {
            type: TreatmentItemType.THERAPY,
            name: 'Trị liệu nghề nghiệp',
            frequency: '3 lần/tuần',
            duration: '6 tháng',
          },
        ],
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should fail when required fields are missing', async () => {
      const request = {
        medicalRecordId: '',
        patientId: '',
        primaryDoctorId: '',
        diagnosis: '',
        treatmentGoals: '',
        startDate: '',
        createdBy: '',
      } as CreateTreatmentPlanRequest;

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when patient ID format is invalid', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: 'INVALID-ID',
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when doctor ID format is invalid', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: 'INVALID-DOCTOR',
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when diagnosis exceeds maximum length', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'A'.repeat(501), // Exceeds 500 character limit
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when treatment goals exceed maximum length', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test diagnosis',
        treatmentGoals: 'A'.repeat(1001), // Exceeds 1000 character limit
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when expected end date is before start date', async () => {
      const startDate = new Date();
      const expectedEndDate = new Date(startDate);
      expectedEndDate.setDate(expectedEndDate.getDate() - 1); // Before start date

      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: startDate.toISOString(),
        expectedEndDate: expectedEndDate.toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when consent is true but consentBy is missing', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        patientConsent: true,
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should accept valid maximum field lengths', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'A'.repeat(500), // Exactly 500 characters
        treatmentGoals: 'B'.repeat(1000), // Exactly 1000 characters
        planDescription: 'C'.repeat(5000), // Exactly 5000 characters
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.planId).toBeDefined();
    });
  });

  describe('Authorization', () => {
    it('should authorize when user is the primary doctor', async () => {
      const doctorId = global.testUtils.generateDoctorId();
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: doctorId,
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const authorized = await useCase.authorize(request, doctorId);

      expect(authorized).toBe(true);
    });

    it('should authorize when user is the creator', async () => {
      const creatorId = global.testUtils.generateDoctorId();
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: creatorId,
      };

      const authorized = await useCase.authorize(request, creatorId);

      expect(authorized).toBe(true);
    });

    it('should not authorize when user is neither primary doctor nor creator', async () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const authorized = await useCase.authorize(request, global.testUtils.generateDoctorId());

      expect(authorized).toBe(false);
    });
  });

  describe('PHI Protection', () => {
    it('should identify treatment plan as containing PHI', () => {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const containsPHI = useCase.involvesPHI(request);

      expect(containsPHI).toBe(true);
    });

    it('should extract patient ID from request', () => {
      const patientId = global.testUtils.generatePatientId();
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId,
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      const extractedPatientId = useCase.getPatientId(request);

      expect(extractedPatientId).toBe(patientId);
    });
  });

  describe('Sequence Generation', () => {
    it('should generate sequential plan IDs', async () => {
      mockRepository.getNextSequence.mockResolvedValueOnce(1);
      mockRepository.getNextSequence.mockResolvedValueOnce(2);
      mockRepository.getNextSequence.mockResolvedValueOnce(3);

      const createPlan = async () => {
        return useCase.execute({
          medicalRecordId: global.testUtils.generateMedicalRecordId(),
          patientId: global.testUtils.generatePatientId(),
          primaryDoctorId: global.testUtils.generateDoctorId(),
          diagnosis: 'Test',
          treatmentGoals: 'Test goals',
          startDate: new Date().toISOString(),
          createdBy: global.testUtils.generateDoctorId(),
        });
      };

      const result1 = await createPlan();
      const result2 = await createPlan();
      const result3 = await createPlan();

      expect(result1.planId).toMatch(/^PLAN-\d{6}-001$/);
      expect(result2.planId).toMatch(/^PLAN-\d{6}-002$/);
      expect(result3.planId).toMatch(/^PLAN-\d{6}-003$/);
    });

    it('should handle repository errors during sequence generation', async () => {
      mockRepository.getNextSequence.mockRejectedValue(new Error('Database connection failed'));

      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Database connection failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository save errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database write error'));

      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        primaryDoctorId: global.testUtils.generateDoctorId(),
        diagnosis: 'Test',
        treatmentGoals: 'Test goals',
        startDate: new Date().toISOString(),
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Database write error');
    });
  });
});
