/**
 * Patient Aggregate Root - Patient Registry V2
 *
 * Manages patient master data and enforces business invariants
 * Based on HL7 FHIR Patient Resource specification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR, Vietnamese Healthcare Standards, HIPAA
 */
import { HealthcareAggregateRoot } from "../../../../shared/domain/base/aggregate-root";
import { DomainEvent } from "../../../../shared/domain/base/domain-event";
import { PatientId } from "../value-objects/PatientId";
import { PersonalInfo } from "../value-objects/PersonalInfo";
import { ContactInfo } from "../value-objects/ContactInfo";
import { BasicMedicalInfo } from "../value-objects/BasicMedicalInfo";
import { PatientLink } from "../value-objects/PatientLink";
import { PatientStatus } from "../value-objects/PatientStatus";
import { CommunicationPreference } from "../value-objects/CommunicationPreference";
import { InsuranceInfo } from "../entities/InsuranceInfo";
import { EmergencyContact } from "../entities/EmergencyContact";
import { PatientConsent } from "../entities/PatientConsent";
export interface PatientProps {
    id: PatientId;
    userId: string;
    personalInfo: PersonalInfo;
    contactInfo: ContactInfo;
    photoUrl?: string;
    communicationPreference?: CommunicationPreference;
    basicMedicalInfo: BasicMedicalInfo;
    insuranceInfo?: InsuranceInfo;
    emergencyContacts: EmergencyContact[];
    consents: PatientConsent[];
    status: PatientStatus;
    mergedInto?: PatientId;
    links: PatientLink[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export declare class Patient extends HealthcareAggregateRoot<PatientProps> {
    private constructor();
    /**
     * Factory method: Register new patient
     * @deprecated Use registerWithId() instead to pass pre-generated PatientId from database
     */
    static register(userId: string, personalInfo: PersonalInfo, contactInfo: ContactInfo, basicMedicalInfo: BasicMedicalInfo, insuranceInfo: InsuranceInfo | undefined, emergencyContacts: EmergencyContact[], createdBy: string): Patient;
    /**
     * Factory method: Register new patient with pre-generated ID from database
     * This is the recommended method to avoid ID collisions
     */
    static registerWithId(patientId: PatientId, userId: string, personalInfo: PersonalInfo, contactInfo: ContactInfo, basicMedicalInfo: BasicMedicalInfo, insuranceInfo: InsuranceInfo | undefined, emergencyContacts: EmergencyContact[], createdBy: string): Patient;
    /**
     * Factory method: Reconstitute from persistence
     */
    static reconstitute(props: PatientProps): Patient;
    /**
     * Update personal information
     */
    updatePersonalInfo(personalInfo: PersonalInfo, updatedBy: string): void;
    /**
     * Update contact information
     */
    updateContactInfo(contactInfo: ContactInfo, updatedBy: string): void;
    /**
     * Update basic medical information
     */
    updateBasicMedicalInfo(basicMedicalInfo: BasicMedicalInfo, updatedBy: string): void;
    /**
     * Update insurance information
     */
    updateInsuranceInfo(insuranceInfo: InsuranceInfo | undefined, updatedBy: string): void;
    /**
     * Add emergency contact
     */
    addEmergencyContact(contact: EmergencyContact, updatedBy: string): void;
    /**
     * Remove emergency contact
     */
    removeEmergencyContact(contactId: string, updatedBy: string): void;
    /**
     * Grant consent
     */
    grantConsent(consent: PatientConsent, updatedBy: string): void;
    /**
     * Merge into master patient (mark as duplicate)
     */
    mergeInto(masterPatientId: PatientId, reason: string, performedBy: string): void;
    /**
     * Link to another patient
     */
    linkTo(otherPatientId: PatientId, linkType: "refer" | "seealso", performedBy: string): void;
    /**
     * Deactivate patient
     */
    deactivate(reason: string, performedBy: string): void;
    /**
     * Mark patient as deceased
     */
    markAsDeceased(performedBy: string): void;
    /**
     * Reactivate patient (from INACTIVE status or, when allowed, DECEASED)
     */
    reactivate(_reason: string, performedBy: string, options?: {
        allowDeceased?: boolean;
    }): void;
    getPatientId(): string | null;
    getPatientIdObject(): PatientId;
    getUserId(): string;
    getPersonalInfo(): PersonalInfo;
    getContactInfo(): ContactInfo;
    getBasicMedicalInfo(): BasicMedicalInfo;
    getInsuranceInfo(): InsuranceInfo | undefined;
    getEmergencyContacts(): EmergencyContact[];
    getConsents(): PatientConsent[];
    getStatus(): PatientStatus;
    getMergedInto(): PatientId | undefined;
    getLinks(): PatientLink[];
    getProps(): PatientProps;
    /**
     * Validate entity state (required by Entity base class)
     */
    validate(): void;
    /**
     * Convert to persistence format (required by Entity base class)
     * Note: This is a minimal stub. Use PatientMapper.toPersistence() for actual persistence.
     */
    toPersistence(): {
        id: string;
        patient_id: string;
    };
    /**
     * Apply domain event (required by AggregateRoot base class)
     */
    protected applyEvent(_event: DomainEvent): void;
    isActive(): boolean;
    isInactive(): boolean;
    isMerged(): boolean;
    isDeceased(): boolean;
    hasBHYTInsurance(): boolean;
    hasValidInsurance(): boolean;
    hasEmergencyContacts(): boolean;
    hasActiveConsents(): boolean;
    hasLinks(): boolean;
    protected validateBusinessInvariants(): void;
    private ensureCanUpdate;
    /**
     * Update patient photo URL
     */
    updatePhoto(photoUrl: string, updatedBy: string): void;
    /**
     * Remove patient photo
     */
    removePhoto(updatedBy: string): void;
    /**
     * Get patient photo URL
     */
    getPhotoUrl(): string | undefined;
    /**
     * Update communication preferences
     */
    updateCommunicationPreference(preference: CommunicationPreference, updatedBy: string): void;
    /**
     * Get communication preferences
     */
    getCommunicationPreference(): CommunicationPreference | undefined;
}
//# sourceMappingURL=Patient.d.ts.map