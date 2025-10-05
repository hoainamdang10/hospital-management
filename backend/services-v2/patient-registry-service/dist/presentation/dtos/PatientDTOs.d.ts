/**
 * Patient DTOs (Data Transfer Objects)
 * Request and Response types for Patient Registry API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
/**
 * Register new patient request
 */
export interface RegisterPatientRequest {
    userId: string;
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
    nationality: string;
    ethnicity?: string;
    occupation?: string;
    maritalStatus?: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    address: {
        street: string;
        ward: string;
        district: string;
        city: string;
        postalCode?: string;
        country?: string;
    };
    preferredContactMethod: 'phone' | 'email' | 'sms';
    bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    knownAllergies?: string[];
    emergencyMedicalInfo?: string;
    insurance?: {
        provider: string;
        policyNumber: string;
        groupNumber?: string;
        validFrom: string;
        validTo: string;
        coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
        bhytNumber?: string;
    };
    emergencyContacts?: Array<{
        name: string;
        relationship: string;
        primaryPhone: string;
        secondaryPhone?: string;
        email?: string;
        address?: string;
        isPrimary?: boolean;
    }>;
}
/**
 * Update patient request
 */
export interface UpdatePatientRequest {
    fullName?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    nationalId?: string;
    nationality?: string;
    ethnicity?: string;
    occupation?: string;
    maritalStatus?: string;
    primaryPhone?: string;
    secondaryPhone?: string;
    email?: string;
    address?: {
        street: string;
        ward: string;
        district: string;
        city: string;
        postalCode?: string;
        country?: string;
    };
    preferredContactMethod?: 'phone' | 'email' | 'sms';
    bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    knownAllergies?: string[];
    emergencyMedicalInfo?: string;
}
/**
 * Update insurance request
 */
export interface UpdateInsuranceRequest {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validFrom: string;
    validTo: string;
    coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    bhytNumber?: string;
}
/**
 * Add emergency contact request
 */
export interface AddEmergencyContactRequest {
    name: string;
    relationship: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    address?: string;
    isPrimary?: boolean;
}
/**
 * Grant consent request
 */
export interface GrantConsentRequest {
    consentType: string;
    expiresAt?: string;
}
/**
 * Merge patients request
 */
export interface MergePatientsRequest {
    duplicatePatientId: string;
    masterPatientId: string;
    reason: string;
}
/**
 * Link patients request
 */
export interface LinkPatientsRequest {
    otherPatientId: string;
    linkType: 'refer' | 'seealso';
}
/**
 * Search patients request
 */
export interface SearchPatientsRequest {
    searchTerm: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
/**
 * Filter patients request
 */
export interface FilterPatientsRequest {
    isActive?: boolean;
    registrationDateFrom?: string;
    registrationDateTo?: string;
    city?: string;
    province?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}
/**
 * Match patients request (PMI)
 */
export interface MatchPatientsRequest {
    fullName?: string;
    dateOfBirth?: string;
    nationalId?: string;
    primaryPhone?: string;
    email?: string;
    onlyCertainMatches?: boolean;
    limit?: number;
}
/**
 * Patient response DTO
 */
export interface PatientResponse {
    patientId: string;
    userId: string;
    personalInfo: {
        fullName: string;
        dateOfBirth: string;
        gender: string;
        nationalId: string;
        nationality: string;
        ethnicity?: string;
        occupation?: string;
        maritalStatus?: string;
    };
    contactInfo: {
        primaryPhone: string;
        secondaryPhone?: string;
        email?: string;
        address: {
            street: string;
            ward: string;
            district: string;
            city: string;
            postalCode?: string;
            country: string;
        };
        preferredContactMethod: string;
    };
    basicMedicalInfo: {
        bloodType?: string;
        knownAllergies: string[];
        emergencyMedicalInfo?: string;
    };
    insuranceInfo?: {
        id: string;
        provider: string;
        policyNumber: string;
        groupNumber?: string;
        validFrom: string;
        validTo: string;
        coverageType: string;
        bhytNumber?: string;
        isActive: boolean;
        isPrimary: boolean;
    };
    emergencyContacts: Array<{
        id: string;
        name: string;
        relationship: string;
        primaryPhone: string;
        secondaryPhone?: string;
        email?: string;
        address?: string;
        isPrimary: boolean;
    }>;
    consents: Array<{
        id: string;
        consentType: string;
        isGranted: boolean;
        grantedAt?: string;
        revokedAt?: string;
        expiresAt?: string;
    }>;
    status: string;
    mergedInto?: string;
    links: Array<{
        otherPatientId: string;
        linkType: string;
        createdAt: string;
        createdBy: string;
    }>;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}
/**
 * Patient match result response
 */
export interface PatientMatchResponse {
    patient: PatientResponse;
    matchGrade: 'certain' | 'probable' | 'possible' | 'certainly-not';
    score: number;
    matchDetails: {
        fullNameMatch: boolean;
        dateOfBirthMatch: boolean;
        nationalIdMatch: boolean;
        phoneMatch: boolean;
        emailMatch: boolean;
    };
}
/**
 * Paginated patients response
 */
export interface PaginatedPatientsResponse {
    success: boolean;
    data: {
        patients: PatientResponse[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}
/**
 * Standard API response
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}
//# sourceMappingURL=PatientDTOs.d.ts.map