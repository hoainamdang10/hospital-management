/**
 * Patient Data Helper
 * Utility functions for patient data processing with smart defaults
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Progressive Profiling
 */
import type { RegisterPatientRequest, UpdatePatientRequest } from '../../presentation/dtos/PatientDTOs';
/**
 * Personal Info interface for create operations
 */
export interface CreatePersonalInfo {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    nationalId: string;
    nationality: string;
    ethnicity: string;
    occupation: string;
    maritalStatus: string;
}
/**
 * Contact Info interface for create operations
 */
export interface CreateContactInfo {
    primaryPhone: string;
    secondaryPhone?: string;
    email: string;
    preferredContactMethod: 'phone' | 'email' | 'sms';
    address: {
        street: string;
        ward: string;
        district: string;
        city: string;
        province: string;
        postalCode?: string;
        country: string;
    };
}
/**
 * Build personal info for CREATE operations
 * Uses "Chưa cập nhật" for missing fields
 */
export declare const buildPersonalInfoForCreate: (data: Partial<RegisterPatientRequest>) => CreatePersonalInfo;
/**
 * Build contact info for CREATE operations
 * Uses "Chưa cập nhật" for missing fields
 */
export declare const buildContactInfoForCreate: (data: Partial<RegisterPatientRequest>) => CreateContactInfo;
/**
 * Merge personal info for UPDATE operations
 * Distinguishes between undefined (no change) and explicit values
 */
export declare const mergePersonalInfoForUpdate: (existing: CreatePersonalInfo, dto: Partial<UpdatePatientRequest>) => CreatePersonalInfo;
/**
 * Merge contact info for UPDATE operations
 * Distinguishes between undefined (no change) and explicit values
 */
export declare const mergeContactInfoForUpdate: (existing: CreateContactInfo, dto: Partial<UpdatePatientRequest>) => CreateContactInfo;
/**
 * Check if personal info has changed
 */
export declare const hasPersonalInfoChanged: (existing: CreatePersonalInfo, updated: CreatePersonalInfo) => boolean;
/**
 * Check if contact info has changed
 */
export declare const hasContactInfoChanged: (existing: CreateContactInfo, updated: CreateContactInfo) => boolean;
/**
 * Get missing fields list for UI prompts
 */
export declare const getMissingFields: (personalInfo: CreatePersonalInfo) => string[];
/**
 * Calculate profile completion percentage
 */
export declare const calculateProfileCompletion: (personalInfo: CreatePersonalInfo) => number;
//# sourceMappingURL=PatientDataHelper.d.ts.map