/**
 * Patient Entity - Domain entity for patient data in Billing Service
 * Simplified patient model for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
export interface Patient {
    id: string;
    userId: string;
    fullName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
    phone?: string;
    email?: string;
    address?: string;
    insuranceInfo?: any;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
/**
 * Patient Insurance Information
 */
export interface PatientInsuranceInfo {
    providerId: string;
    providerName: string;
    policyNumber: string;
    memberId: string;
    groupNumber?: string;
    coverage: {
        consultationCoverage: number;
        medicationCoverage: number;
        laboratoryCoverage: number;
        procedureCoverage: number;
        emergencyCoverage: number;
        generalCoverage: number;
    };
    validFrom: Date;
    validTo: Date;
    isActive: boolean;
    copayAmount?: number;
    deductibleAmount?: number;
    annualMaximum?: number;
    remainingAnnualMaximum?: number;
}
/**
 * Patient Repository Interface
 */
export interface IPatientRepository {
    findById(id: string): Promise<Patient | null>;
    findByUserId(userId: string): Promise<Patient | null>;
    findByNationalId(nationalId: string): Promise<Patient | null>;
    exists(id: string): Promise<boolean>;
    getInsuranceInfo(patientId: string): Promise<PatientInsuranceInfo | null>;
    updateInsuranceInfo(patientId: string, insuranceInfo: PatientInsuranceInfo): Promise<void>;
}
//# sourceMappingURL=Patient.d.ts.map