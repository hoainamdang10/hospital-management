/**
 * Patient DTOs (Data Transfer Objects)
 * Request and Response types for Patient Registry API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */

// ==================== REQUEST DTOs ====================

/**
 * Register new patient request
 */
export interface RegisterPatientRequest {
  userId: string;

  // Personal Info
  fullName: string;
  dateOfBirth: string; // ISO date string
  gender: 'male' | 'female' | 'other';
  nationalId: string; // CMND/CCCD
  nationality: string;
  ethnicity?: string;
  occupation?: string;
  maritalStatus?: string;

  // Contact Info
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
    province: string; // Province/City level (e.g., "Hồ Chí Minh", "Đồng Nai")
    postalCode?: string;
    country?: string;
  };
  preferredContactMethod: 'phone' | 'email' | 'sms';

  // Basic Medical Info
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  knownAllergies?: string[];
  emergencyMedicalInfo?: string;

  // Insurance Info (optional)
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validFrom: string; // ISO date string
    validTo: string; // ISO date string
    coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    bhytNumber?: string;
  };

  // Emergency Contacts
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
  // Personal Info
  fullName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  nationalId?: string;
  nationality?: string;
  ethnicity?: string;
  occupation?: string;
  maritalStatus?: string;

  // Contact Info
  primaryPhone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: {
    street: string;
    ward: string;
    district: string;
    city: string;
    province: string; // Province/City level
    postalCode?: string;
    country?: string;
  };
  preferredContactMethod?: 'phone' | 'email' | 'sms';

  // Basic Medical Info
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
  expiresAt?: string; // ISO date string
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

// ==================== RESPONSE DTOs ====================

/**
 * Patient response DTO
 */
export interface PatientResponse {
  patientId: string;
  userId: string;

  // Personal Info
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

  // Contact Info
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

  // Basic Medical Info
  basicMedicalInfo: {
    bloodType?: string;
    knownAllergies: string[];
    emergencyMedicalInfo?: string;
  };

  // Insurance Info
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

  // Emergency Contacts
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

  // Consents
  consents: Array<{
    id: string;
    consentType: string;
    isGranted: boolean;
    grantedAt?: string;
    revokedAt?: string;
    expiresAt?: string;
  }>;

  // Status
  status: string;
  mergedInto?: string;

  // Links
  links: Array<{
    otherPatientId: string;
    linkType: string;
    createdAt: string;
    createdBy: string;
  }>;

  // Metadata
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
  consentType: string; // 'data_sharing', 'treatment', 'research'
  grantedBy: string;
  expiresAt?: string; // ISO date string
  notes?: string;
}

/**
 * Mark as deceased request
 */
export interface MarkAsDeceasedRequest {
  // No additional fields needed, patientId from URL
}

/**
 * Reactivate patient request
 */
export interface ReactivatePatientRequest {
  reason: string;
}

/**
 * Standard API response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
