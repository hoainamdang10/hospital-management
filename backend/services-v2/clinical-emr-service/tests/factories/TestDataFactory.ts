/**
 * TestDataFactory - Test Utilities
 * Factory for creating test data and mock objects
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Testing Best Practices
 */

import { MedicalRecordAggregate } from '../../src/domain/aggregates/clinical.aggregate';
import { RecordId } from '../../src/domain/value-objects/RecordId';
import { BasicVitalSigns } from '../../src/domain/value-objects/BasicVitalSigns';
import { Diagnosis, DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../src/domain/value-objects/Diagnosis';
import { Medication, DosageForm, RouteOfAdministration, FrequencyUnit } from '../../src/domain/value-objects/Medication';
import { ClinicalEMRApplicationService } from '../../src/application/services/ClinicalEMRApplicationService';
import { CreateMedicalRecordUseCase } from '../../src/application/use-cases/CreateMedicalRecordUseCase';
import { UpdateMedicalRecordUseCase } from '../../src/application/use-cases/UpdateMedicalRecordUseCase';
import { GenerateMedicalReportUseCase } from '../../src/application/use-cases/GenerateMedicalReportUseCase';
import { SearchMedicalRecordsUseCase } from '../../src/application/use-cases/SearchMedicalRecordsUseCase';
import { AddDiagnosisCommandHandler } from '../../src/application/handlers/commands/AddDiagnosisCommandHandler';
import { AddMedicationCommandHandler } from '../../src/application/handlers/commands/AddMedicationCommandHandler';
import { AdvancedSearchService } from '../../src/infrastructure/external/AdvancedSearchService';

export class TestDataFactory {
  
  /**
   * Create medical record request for testing
   */
  createMedicalRecordRequest(overrides: Partial<any> = {}): any {
    const defaultRequest = {
      patientId: 'PAT-202412-001',
      doctorId: 'CARD-DOC-202412-001',
      appointmentId: 'APT-202412-001',
      visitDate: new Date(),
      symptoms: 'Chest pain and shortness of breath',
      examinationNotes: 'Patient presents with typical angina symptoms',
      vitalSigns: {
        temperature: 36.8,
        bloodPressure: '120/80',
        heartRate: 72,
        weight: 70,
        height: 170,
        oxygenSaturation: 98
      },
      specialtyCode: 'CARDIOLOGY',
      insuranceInfo: {
        type: 'BHYT',
        number: 'HS4010123456789',
        validUntil: new Date('2024-12-31'),
        coverageLevel: '100%'
      },
      billingInfo: {
        consultationFee: 200000, // 200,000 VND
        estimatedCost: 500000,   // 500,000 VND
        currency: 'VND'
      }
    };

    return { ...defaultRequest, ...overrides };
  }

  /**
   * Create medical record aggregate for testing
   */
  createMedicalRecordAggregate(overrides: Partial<any> = {}): MedicalRecordAggregate {
    const defaults = {
      patientId: 'PAT-202412-001',
      doctorId: 'CARD-DOC-202412-001',
      appointmentId: 'APT-202412-001',
      visitDate: new Date(),
      symptoms: 'Chest pain and shortness of breath',
      examinationNotes: 'Patient presents with typical angina symptoms',
      diagnoses: [],
      medications: [],
      vitalSigns: undefined
    };

    const data = { ...defaults, ...overrides };

    // Create RecordId
    const recordId = RecordId.generate();

    // Create vital signs if provided
    let vitalSigns: BasicVitalSigns | undefined;
    if (data.vitalSigns) {
      vitalSigns = BasicVitalSigns.create(
        data.vitalSigns.temperature || 36.8,
        data.vitalSigns.bloodPressure || '120/80',
        data.vitalSigns.heartRate || 72,
        data.vitalSigns.weight || 70,
        data.vitalSigns.height || 170,
        data.vitalSigns.oxygenSaturation || 98
      );
    }

    // Create medical record aggregate
    const medicalRecord = MedicalRecordAggregate.create(
      recordId,
      data.patientId,
      data.doctorId,
      data.appointmentId,
      data.visitDate,
      data.symptoms,
      data.examinationNotes,
      vitalSigns,
      data.specialtyCode || 'CARDIOLOGY'
    );

    // Add diagnoses if provided
    if (data.diagnoses && data.diagnoses.length > 0) {
      data.diagnoses.forEach((diagnosis: any) => {
        medicalRecord.addDiagnosis(diagnosis);
      });
    }

    // Add medications if provided
    if (data.medications && data.medications.length > 0) {
      data.medications.forEach((medication: any) => {
        medicalRecord.addMedication(medication);
      });
    }

    return medicalRecord;
  }

  /**
   * Create test diagnosis
   */
  createDiagnosis(overrides: Partial<any> = {}): Diagnosis {
    const defaults = {
      code: 'I25.9',
      display: 'Chronic ischaemic heart disease, unspecified',
      category: DiagnosisCategory.PRIMARY,
      severity: DiagnosisSeverity.MODERATE,
      status: DiagnosisStatus.CONFIRMED,
      recordedBy: 'CARD-DOC-202412-001',
      options: {
        confidence: 0.9,
        notes: 'Based on clinical presentation and patient history'
      }
    };

    const data = { ...defaults, ...overrides };

    return Diagnosis.create(
      data.code,
      data.display,
      data.category,
      data.severity,
      data.status,
      data.recordedBy,
      data.options
    );
  }

  /**
   * Create Vietnamese diagnosis
   */
  createVietnameseDiagnosis(overrides: Partial<any> = {}): Diagnosis {
    const defaults = {
      code: 'BYT-VN-2024-I25',
      display: 'Bệnh tim thiếu máu cục bộ mạn tính',
      category: DiagnosisCategory.PRIMARY,
      severity: DiagnosisSeverity.MODERATE,
      status: DiagnosisStatus.CONFIRMED,
      recordedBy: 'CARD-DOC-202412-001',
      options: {
        icd10Code: 'I25.9',
        vietnameseClassification: 'BYT-VN-2024-I25',
        confidence: 0.9
      }
    };

    const data = { ...defaults, ...overrides };

    return Diagnosis.createVietnamese(
      data.code,
      data.display,
      data.category,
      data.severity,
      data.status,
      data.recordedBy,
      data.options
    );
  }

  /**
   * Create test medication
   */
  createMedication(overrides: Partial<any> = {}): Medication {
    const defaults = {
      code: 'VN-ASPIR-01',
      name: 'Aspirin',
      strength: '100mg',
      dosageForm: DosageForm.TABLET,
      route: RouteOfAdministration.ORAL,
      dosage: '1 tablet',
      frequency: 'once',
      frequencyUnit: FrequencyUnit.DAILY,
      instructions: 'Take with food to reduce gastric irritation',
      prescribedBy: 'CARD-DOC-202412-001',
      options: {
        genericName: 'Acetylsalicylic acid',
        brandName: 'Aspirin',
        duration: '30 days'
      }
    };

    const data = { ...defaults, ...overrides };

    return Medication.create(
      data.code,
      data.name,
      data.strength,
      data.dosageForm,
      data.route,
      data.dosage,
      data.frequency,
      data.frequencyUnit,
      data.instructions,
      data.prescribedBy,
      data.options
    );
  }

  /**
   * Create Vietnamese medication
   */
  createVietnameseMedication(overrides: Partial<any> = {}): Medication {
    const defaults = {
      code: 'VN-ASPIR-01',
      name: 'Aspirin',
      strength: '100mg',
      dosageForm: DosageForm.TABLET,
      route: RouteOfAdministration.ORAL,
      dosage: '1 viên',
      frequency: '1 lần',
      frequencyUnit: FrequencyUnit.DAILY,
      instructions: 'Uống sau ăn để tránh kích ứng dạ dày',
      prescribedBy: 'CARD-DOC-202412-001',
      registrationNumber: 'VD-12345-01',
      options: {
        manufacturer: 'Công ty Dược phẩm Việt Nam'
      }
    };

    const data = { ...defaults, ...overrides };

    return Medication.createVietnamese(
      data.code,
      data.name,
      data.strength,
      data.dosageForm,
      data.route,
      data.dosage,
      data.frequency,
      data.frequencyUnit,
      data.instructions,
      data.prescribedBy,
      data.registrationNumber,
      data.options
    );
  }

  /**
   * Create vital signs
   */
  createVitalSigns(overrides: Partial<any> = {}): BasicVitalSigns {
    const defaults = {
      temperature: 36.8,
      bloodPressure: '120/80',
      heartRate: 72,
      weight: 70,
      height: 170,
      oxygenSaturation: 98
    };

    const data = { ...defaults, ...overrides };

    return BasicVitalSigns.create(
      data.temperature,
      data.bloodPressure,
      data.heartRate,
      data.weight,
      data.height,
      data.oxygenSaturation
    );
  }

  /**
   * Create clinical EMR application service with mocks
   */
  createClinicalEMRApplicationService(
    mockRepository: any,
    mockEventPublisher: any
  ): ClinicalEMRApplicationService {
    // Create use cases
    const createUseCase = new CreateMedicalRecordUseCase(mockRepository, mockEventPublisher);
    const updateUseCase = new UpdateMedicalRecordUseCase(mockRepository, mockEventPublisher);
    const generateReportUseCase = new GenerateMedicalReportUseCase(mockRepository);
    const searchUseCase = new SearchMedicalRecordsUseCase(mockRepository, new AdvancedSearchService());

    // Create command handlers
    const addDiagnosisHandler = new AddDiagnosisCommandHandler(mockRepository, mockEventPublisher);
    const addMedicationHandler = new AddMedicationCommandHandler(mockRepository, mockEventPublisher);

    // Create application service
    return new ClinicalEMRApplicationService(
      createUseCase,
      updateUseCase,
      null as any, // getMedicalRecordUseCase
      null as any, // getPatientMedicalRecordsUseCase
      generateReportUseCase,
      searchUseCase,
      addDiagnosisHandler,
      addMedicationHandler,
      null as any // getMedicalRecordDetailsQueryHandler
    );
  }

  /**
   * Create test patient data
   */
  createPatientData(overrides: Partial<any> = {}): any {
    const defaults = {
      patientId: 'PAT-202412-001',
      fullName: 'Nguyễn Văn Anh',
      dateOfBirth: new Date('1980-05-15'),
      gender: 'Nam',
      address: 'Số 123, Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội',
      phoneNumber: '0901234567',
      identityCard: '001080012345',
      ethnicity: 'Kinh',
      occupation: 'Kỹ sư',
      emergencyContact: {
        name: 'Nguyễn Thị Bình',
        relationship: 'Vợ',
        phoneNumber: '0907654321'
      }
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Create test doctor data
   */
  createDoctorData(overrides: Partial<any> = {}): any {
    const defaults = {
      doctorId: 'CARD-DOC-202412-001',
      fullName: 'BS. Trần Văn Bình',
      specialtyCode: 'CARDIOLOGY',
      specialtyName: 'Tim mạch',
      licenseNumber: 'VN-MD-12345',
      department: 'Khoa Tim mạch',
      title: 'Bác sĩ chuyên khoa I',
      experience: 15,
      phoneNumber: '0912345678',
      email: 'bs.tranvanbình@hospital.com'
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Create test insurance data
   */
  createInsuranceData(type: 'BHYT' | 'BHTN' | 'Private' = 'BHYT', overrides: Partial<any> = {}): any {
    const bhytDefaults = {
      type: 'BHYT',
      number: 'HS4010123456789',
      validUntil: new Date('2024-12-31'),
      coverageLevel: '100%',
      issuedBy: 'BHXH Hà Nội',
      beneficiaryType: 'Người lao động'
    };

    const bhtnDefaults = {
      type: 'BHTN',
      number: 'TN2024123456789',
      validUntil: new Date('2024-12-31'),
      coverageLevel: '100%',
      accidentType: 'Tai nạn lao động',
      accidentDate: new Date('2024-01-15'),
      employerInfo: 'Công ty TNHH ABC'
    };

    const privateDefaults = {
      type: 'Private',
      number: 'PV2024123456789',
      validUntil: new Date('2024-12-31'),
      coverageLevel: '80%',
      insuranceCompany: 'Bảo hiểm Bảo Việt',
      policyType: 'Bảo hiểm sức khỏe cá nhân'
    };

    let defaults;
    switch (type) {
      case 'BHTN':
        defaults = bhtnDefaults;
        break;
      case 'Private':
        defaults = privateDefaults;
        break;
      default:
        defaults = bhytDefaults;
    }

    return { ...defaults, ...overrides };
  }

  /**
   * Create test billing data
   */
  createBillingData(overrides: Partial<any> = {}): any {
    const defaults = {
      consultationFee: 200000, // 200,000 VND
      medicationCost: 150000,  // 150,000 VND
      testCost: 300000,        // 300,000 VND
      procedureCost: 500000,   // 500,000 VND
      totalCost: 1150000,      // 1,150,000 VND
      insuranceCoverage: 80,   // 80%
      insuranceAmount: 920000, // 920,000 VND
      patientPayment: 230000,  // 230,000 VND
      currency: 'VND',
      paymentStatus: 'pending',
      paymentMethod: 'cash'
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Create multiple test medical records
   */
  createMultipleMedicalRecords(count: number, baseOverrides: Partial<any> = {}): MedicalRecordAggregate[] {
    const records: MedicalRecordAggregate[] = [];

    for (let i = 0; i < count; i++) {
      const overrides = {
        ...baseOverrides,
        patientId: `PAT-202412-${String(i + 1).padStart(3, '0')}`,
        appointmentId: `APT-202412-${String(i + 1).padStart(3, '0')}`
      };

      records.push(this.createMedicalRecordAggregate(overrides));
    }

    return records;
  }

  /**
   * Create test search criteria
   */
  createSearchCriteria(overrides: Partial<any> = {}): any {
    const defaults = {
      searchText: 'đau ngực',
      patientId: undefined,
      doctorId: undefined,
      dateRange: {
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31')
      },
      diagnosisCode: undefined,
      medicationCode: undefined,
      language: 'vi',
      pageSize: 20,
      pageNumber: 1,
      sortBy: 'visitDate',
      sortOrder: 'desc',
      includeVietnameseTerms: true,
      enableFuzzySearch: true,
      minRelevanceScore: 0.7
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Create test report request
   */
  createReportRequest(overrides: Partial<any> = {}): any {
    const defaults = {
      recordId: 'MR-202412-001',
      reportType: 'detailed',
      format: 'json',
      language: 'vi',
      includeVitalSigns: true,
      includeDiagnoses: true,
      includeMedications: true,
      includeVietnameseTerminology: true,
      includeFHIRData: false,
      watermark: 'CONFIDENTIAL',
      requestedBy: 'CARD-DOC-202412-001'
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Create test performance data
   */
  createPerformanceTestData(recordCount: number): {
    medicalRecords: MedicalRecordAggregate[];
    searchQueries: any[];
    reportRequests: any[];
  } {
    const medicalRecords = this.createMultipleMedicalRecords(recordCount);
    
    const searchQueries = [
      this.createSearchCriteria({ searchText: 'đau ngực' }),
      this.createSearchCriteria({ searchText: 'tim mạch' }),
      this.createSearchCriteria({ searchText: 'huyết áp' }),
      this.createSearchCriteria({ diagnosisCode: 'I25' }),
      this.createSearchCriteria({ medicationCode: 'VN-ASPIR' })
    ];

    const reportRequests = medicalRecords.slice(0, 5).map(record => 
      this.createReportRequest({ recordId: record.id.value })
    );

    return {
      medicalRecords,
      searchQueries,
      reportRequests
    };
  }

  /**
   * Create test error scenarios
   */
  createErrorScenarios(): any[] {
    return [
      {
        name: 'Empty patient ID',
        data: this.createMedicalRecordRequest({ patientId: '' }),
        expectedError: 'Patient ID không được để trống'
      },
      {
        name: 'Invalid doctor ID',
        data: this.createMedicalRecordRequest({ doctorId: 'INVALID-DOCTOR' }),
        expectedError: 'Doctor ID không hợp lệ'
      },
      {
        name: 'Invalid Vietnamese drug code',
        data: {
          medicationCode: 'INVALID-CODE',
          vietnameseDrugCode: 'INVALID-FORMAT'
        },
        expectedError: 'Mã thuốc Việt Nam không đúng định dạng'
      },
      {
        name: 'Expired BHYT card',
        data: this.createInsuranceData('BHYT', { validUntil: new Date('2023-12-31') }),
        expectedError: 'Thẻ BHYT đã hết hạn'
      },
      {
        name: 'Invalid diagnosis code',
        data: {
          diagnosisCode: 'INVALID',
          category: 'invalid_category'
        },
        expectedError: 'Mã chẩn đoán không hợp lệ'
      }
    ];
  }
}
