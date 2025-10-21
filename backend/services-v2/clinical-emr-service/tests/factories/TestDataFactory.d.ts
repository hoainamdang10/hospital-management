/**
 * TestDataFactory - Test Utilities
 * Factory for creating test data and mock objects
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Testing Best Practices
 */
import { MedicalRecordAggregate } from '../../src/domain/aggregates/clinical.aggregate';
import { BasicVitalSigns } from '../../src/domain/value-objects/BasicVitalSigns';
import { Diagnosis } from '../../src/domain/value-objects/Diagnosis';
import { Medication } from '../../src/domain/value-objects/Medication';
import { ClinicalEMRApplicationService } from '../../src/application/services/ClinicalEMRApplicationService';
export declare class TestDataFactory {
    /**
     * Create medical record request for testing
     */
    createMedicalRecordRequest(overrides?: Partial<any>): any;
    /**
     * Create medical record aggregate for testing
     */
    createMedicalRecordAggregate(overrides?: Partial<any>): MedicalRecordAggregate;
    /**
     * Create test diagnosis
     */
    createDiagnosis(overrides?: Partial<any>): Diagnosis;
    /**
     * Create Vietnamese diagnosis
     */
    createVietnameseDiagnosis(overrides?: Partial<any>): Diagnosis;
    /**
     * Create test medication
     */
    createMedication(overrides?: Partial<any>): Medication;
    /**
     * Create Vietnamese medication
     */
    createVietnameseMedication(overrides?: Partial<any>): Medication;
    /**
     * Create vital signs
     */
    createVitalSigns(overrides?: Partial<any>): BasicVitalSigns;
    /**
     * Create clinical EMR application service with mocks
     */
    createClinicalEMRApplicationService(mockRepository: any, mockEventPublisher: any): ClinicalEMRApplicationService;
    /**
     * Create test patient data
     */
    createPatientData(overrides?: Partial<any>): any;
    /**
     * Create test doctor data
     */
    createDoctorData(overrides?: Partial<any>): any;
    /**
     * Create test insurance data
     */
    createInsuranceData(type?: 'BHYT' | 'BHTN' | 'Private', overrides?: Partial<any>): any;
    /**
     * Create test billing data
     */
    createBillingData(overrides?: Partial<any>): any;
    /**
     * Create multiple test medical records
     */
    createMultipleMedicalRecords(count: number, baseOverrides?: Partial<any>): MedicalRecordAggregate[];
    /**
     * Create test search criteria
     */
    createSearchCriteria(overrides?: Partial<any>): any;
    /**
     * Create test report request
     */
    createReportRequest(overrides?: Partial<any>): any;
    /**
     * Create test performance data
     */
    createPerformanceTestData(recordCount: number): {
        medicalRecords: MedicalRecordAggregate[];
        searchQueries: any[];
        reportRequests: any[];
    };
    /**
     * Create test error scenarios
     */
    createErrorScenarios(): any[];
}
//# sourceMappingURL=TestDataFactory.d.ts.map