/**
 * Patient Aggregate Root - Patient Registry Management
 * V2 Clean Architecture + DDD Implementation
 * Consolidated from Patient.ts and patient.aggregate.ts
 * Schema: patient_schema
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { HealthcareAggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { PatientId } from '../value-objects/PatientId';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { ContactInfo } from '../value-objects/ContactInfo';
import { MedicalInfo } from '../value-objects/MedicalInfo';
import { InsuranceInfo } from '../entities/InsuranceInfo';
import { EmergencyContact } from '../entities/EmergencyContact';
import { PatientConsent } from '../entities/PatientConsent';
import { MedicalHistory } from '../entities/MedicalHistory';
export interface PatientProps {
    id: PatientId;
    userId: string;
    personalInfo: PersonalInfo;
    contactInfo: ContactInfo;
    medicalInfo: MedicalInfo;
    insuranceInfo?: InsuranceInfo;
    emergencyContacts: EmergencyContact[];
    consents: PatientConsent[];
    medicalHistory: MedicalHistory[];
    registrationDate: Date;
    lastVisitDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Patient extends HealthcareAggregateRoot<PatientProps> {
    private constructor();
    static create(userId: string, personalInfo: PersonalInfo, contactInfo: ContactInfo, medicalInfo: MedicalInfo, insuranceInfo?: InsuranceInfo): Patient;
    static reconstitute(props: PatientProps): Patient;
    get id(): PatientId;
    get userId(): string;
    get personalInfo(): PersonalInfo;
    get contactInfo(): ContactInfo;
    get medicalInfo(): MedicalInfo;
    get insuranceInfo(): InsuranceInfo | undefined;
    get emergencyContacts(): EmergencyContact[];
    get consents(): PatientConsent[];
    get medicalHistory(): MedicalHistory[];
    get registrationDate(): Date;
    get lastVisitDate(): Date | undefined;
    get isActive(): boolean;
    updatePersonalInfo(personalInfo: PersonalInfo): void;
    updateContactInfo(contactInfo: ContactInfo): void;
    updateMedicalInfo(medicalInfo: MedicalInfo): void;
    updateInsuranceInfo(insuranceInfo: InsuranceInfo): void;
    addEmergencyContact(emergencyContact: EmergencyContact): void;
    removeEmergencyContact(contactId: string): void;
    grantConsent(consentType: string, witnessId?: string): void;
    withdrawConsent(consentType: string): void;
    addMedicalHistory(medicalHistory: MedicalHistory): void;
    updateLastVisit(): void;
    deactivate(): void;
    activate(): void;
    hasValidInsurance(): boolean;
    getPrimaryInsurance(): InsuranceInfo | undefined;
    getPrimaryEmergencyContact(): EmergencyContact | undefined;
    hasConsentFor(consentType: string): boolean;
    getActiveConsents(): PatientConsent[];
    getAge(): number;
    isMinor(): boolean;
    requiresGuardianConsent(): boolean;
    hasBHYTInsurance(): boolean;
    hasBHTNInsurance(): boolean;
    hasPrivateInsurance(): boolean;
    isSelfPay(): boolean;
    hasCondition(conditionName: string): boolean;
    getActiveConditions(): MedicalHistory[];
    getChronicConditions(): MedicalHistory[];
    getCriticalConditions(): MedicalHistory[];
    canScheduleAppointment(): boolean;
    canAccessMedicalRecords(): boolean;
    canParticipateInResearch(): boolean;
    getAuditInfo(): object;
    equals(other: Patient): boolean;
    /**
     * Validate business invariants
     */
    protected validateBusinessInvariants(): void;
    /**
     * Apply domain event
     */
    protected applyEvent(event: DomainEvent): void;
    /**
     * Get patient ID (required by HealthcareAggregateRoot)
     */
    getPatientId(): string | null;
    /**
     * Convert to persistence format
     */
    toPersistence(): any;
    /**
     * Create from persistence data
     */
    static fromPersistence(data: any): Patient;
    /**
     * Vietnamese healthcare compliance check
     */
    isVietnameseHealthcareCompliant(): boolean;
    /**
     * HIPAA compliance check
     */
    isHIPAACompliant(): boolean;
    /**
     * Get patient summary for logging (no sensitive data)
     */
    getSummaryForLogging(): object;
    /**
     * Check if patient has valid Vietnamese insurance
     */
    hasVietnameseInsurance(): boolean;
    /**
     * Get Vietnamese insurance number (BHYT)
     */
    getVietnameseInsuranceNumber(): string | null;
}
//# sourceMappingURL=Patient.d.ts.map