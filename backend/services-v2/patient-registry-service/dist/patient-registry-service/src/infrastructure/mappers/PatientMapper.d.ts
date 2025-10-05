/**
 * PatientMapper - Infrastructure Layer
 * Maps between Patient aggregate and database records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
import { Patient } from '../../domain/aggregates/Patient';
/**
 * DTO for PersonalInfo JSONB field
 */
export interface PersonalInfoDTO {
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
    nationality: string;
    ethnicity?: string;
    occupation?: string;
    maritalStatus?: string;
}
/**
 * DTO for ContactInfo JSONB field
 */
export interface ContactInfoDTO {
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    address: {
        street: string;
        ward: string;
        district: string;
        city: string;
        province: string;
        postalCode?: string;
        country: string;
    };
    preferredContactMethod: 'phone' | 'email' | 'sms';
}
/**
 * DTO for BasicMedicalInfo JSONB field
 */
export interface BasicMedicalInfoDTO {
    bloodType?: string;
    knownAllergies: string[];
    emergencyMedicalInfo?: string;
}
/**
 * Database record structure for patients table
 */
export interface PatientRecord {
    id: string;
    patient_id: string;
    user_id: string;
    personal_info: PersonalInfoDTO;
    contact_info: ContactInfoDTO;
    basic_medical_info: BasicMedicalInfoDTO;
    status: string;
    merged_into?: string | null;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
}
/**
 * Database record for insurance_info table
 */
export interface InsuranceRecord {
    id: string;
    patient_id: string;
    provider: string;
    policy_number: string;
    group_number?: string | null;
    valid_from: string;
    valid_to: string;
    coverage_type: string;
    is_vietnamese_insurance: boolean;
    bhyt_number?: string | null;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
/**
 * Database record for emergency_contacts table
 */
export interface EmergencyContactRecord {
    id: string;
    patient_id: string;
    name: string;
    relationship: string;
    primary_phone: string;
    secondary_phone?: string | null;
    email?: string | null;
    address?: string | null;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
/**
 * Database record for patient_consents table
 */
export interface PatientConsentRecord {
    id: string;
    patient_id: string;
    consent_type: string;
    is_granted: boolean;
    is_active: boolean;
    granted_at?: string | null;
    revoked_at?: string | null;
    expires_at?: string | null;
    created_at: string;
    updated_at: string;
}
/**
 * Database record for patient_links table
 */
export interface PatientLinkRecord {
    id: string;
    patient_id: string;
    other_patient_id: string;
    link_type: string;
    created_at: string;
    created_by: string;
}
/**
 * PatientMapper - Maps between domain and persistence
 */
export declare class PatientMapper {
    /**
     * Map from database records to Patient aggregate
     */
    static toDomain(patientRecord: PatientRecord, insuranceRecord?: InsuranceRecord | null, emergencyContactRecords?: EmergencyContactRecord[], consentRecords?: PatientConsentRecord[], linkRecords?: PatientLinkRecord[]): Patient;
    /**
     * Map from Patient aggregate to database record
     */
    static toPersistence(patient: Patient): {
        patientRecord: Partial<PatientRecord>;
        insuranceRecord?: Partial<InsuranceRecord>;
        emergencyContactRecords: Partial<EmergencyContactRecord>[];
        consentRecords: Partial<PatientConsentRecord>[];
        linkRecords: Partial<PatientLinkRecord>[];
    };
}
//# sourceMappingURL=PatientMapper.d.ts.map