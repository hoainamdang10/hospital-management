/**
 * Patient API Service
 * Handles all patient-related API calls
 *
 * MIGRATED TO SESSION-BASED AUTH
 * Uses axios.ts with HTTP-only cookies for authentication
 */

import apiClient from './axios';

export interface EmergencyContact {
  contactId?: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
}

export interface Insurance {
  insuranceId?: string;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
  validFrom: string;
  validTo: string;
  bhytNumber?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  isVietnameseInsurance?: boolean;
}

export interface Consent {
  consentId?: string;
  consentType: 'DATA_SHARING' | 'TREATMENT' | 'RESEARCH' | 'MARKETING';
  status: 'ACTIVE' | 'REVOKED';
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
}

export interface CommunicationPreferences {
  preferredMethod: 'EMAIL' | 'SMS' | 'PUSH' | 'PHONE';
  allowEmail: boolean;
  allowSMS: boolean;
  allowPush: boolean;
  language: string;
}

export type AccountStatus =
  | 'active'
  | 'deactivated'
  | 'locked'
  | 'pending_verification'
  | 'suspended';

export interface Patient {
  id: string;
  patientId: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
  gender?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  bloodType?: string;
  accountStatus?: AccountStatus;
  emergencyContacts?: EmergencyContact[];
  insurance?: Insurance[];
  personalInfo?: {
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    nationalId?: string;
    nationality?: string;
    ethnicity?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  contactInfo?: {
    primaryPhone?: string;
    secondaryPhone?: string;
    email?: string;
    preferredContactMethod?: string;
    address?: {
      street?: string;
      ward?: string;
      district?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
  };
  basicMedicalInfo?: {
    bloodType?: string;
    knownAllergies?: string[];
    emergencyMedicalInfo?: string;
  };
}

export interface PatientStatistics {
  total: number;
  byGender: {
    male: number;
    female: number;
    other: number;
    unknown: number;
  };
  byAgeRange: {
    '0-18': number;
    '19-40': number;
    '41-60': number;
    '60+': number;
  };
  byInsuranceType: {
    bhyt: number;
    bhtn: number;
    private: number;
    selfPay: number;
  };
  byStatus: {
    active: number;
    inactive: number;
    deceased: number;
    merged: number;
  };
  registrationTrend: Array<{ month: string; count: number }>;
}

function buildAddressString(address?: any): string {
  if (!address || typeof address !== 'object') {
    return '';
  }

  const parts = [
    address.street,
    address.ward || address.wardName,
    address.district || address.districtName,
    address.city || address.cityName,
    address.province || address.state,
    address.postalCode,
    address.country,
  ]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);

  return parts.join(', ');
}

function normalizeAddress(address?: any) {
  if (!address || typeof address !== 'object') {
    return undefined;
  }

  return {
    street: address.street || address.streetName,
    ward: address.ward || address.wardName,
    district: address.district || address.districtName,
    city: address.city || address.cityName,
    province: address.province || address.state,
    postalCode: address.postalCode || address.zip,
    country: address.country,
  };
}

function normalizePatient(raw: any): Patient {
  if (!raw) {
    return {
      id: '',
      patientId: '',
      userId: '',
      firstName: 'Bệnh nhân',
      lastName: '',
    };
  }

  const personalInfoRaw = raw.personalInfo || raw.personal_info || {};
  const contactInfoRaw = raw.contactInfo || raw.contact_info || {};
  const basicMedicalInfoRaw = raw.basicMedicalInfo || raw.basic_medical_info || {};
  const addressRaw =
    contactInfoRaw.address ||
    contactInfoRaw.addressInfo ||
    contactInfoRaw.address_info ||
    raw.addressInfo ||
    raw.address_info;

  const patientId = raw.patientId || raw.patient_id || raw.id || '';
  const userId = raw.userId || raw.user_id || '';
  const fullName =
    raw.fullName ||
    personalInfoRaw.fullName ||
    raw.full_name ||
    `${raw.firstName || raw.first_name || ''} ${raw.lastName || raw.last_name || ''}`.trim();

  let firstName = raw.firstName || personalInfoRaw.firstName || raw.first_name;
  let lastName = raw.lastName || personalInfoRaw.lastName || raw.last_name;

  if (!firstName && !lastName && typeof fullName === 'string' && fullName.length > 0) {
    const parts = fullName.trim().split(' ');
    lastName = parts.pop() || '';
    firstName = parts.join(' ');
  }

  const phoneNumber =
    raw.primaryPhone ||
    contactInfoRaw.primaryPhone ||
    contactInfoRaw.primary_phone ||
    raw.primary_phone ||
    raw.phoneNumber ||
    raw.phone_number ||
    raw.phone ||
    raw.contactPhone ||
    contactInfoRaw.phoneNumber ||
    '';

  const email =
    raw.email || raw.contactEmail || contactInfoRaw.email || contactInfoRaw.primaryEmail || '';

  const gender = (raw.gender || raw.personal_info?.gender || personalInfoRaw.gender || '')
    .toString()
    .toUpperCase();

  const dateOfBirth =
    raw.dateOfBirth || raw.date_of_birth || personalInfoRaw.dateOfBirth || undefined;

  const bloodType =
    raw.bloodType ||
    raw.blood_type ||
    basicMedicalInfoRaw.bloodType ||
    basicMedicalInfoRaw.blood_type;

  // Normalize account status
  const accountStatusRaw = raw.accountStatus || raw.account_status || raw.status || 'active';
  const accountStatus = accountStatusRaw.toLowerCase() as AccountStatus;
  const createdAt = raw.createdAt || raw.created_at;
  const updatedAt = raw.updatedAt || raw.updated_at;

  return {
    id: raw.id || patientId,
    patientId,
    userId,
    firstName: firstName || fullName || 'Bệnh nhân',
    lastName: lastName || '',
    fullName: fullName || `${firstName || ''} ${lastName || ''}`.trim(),
    dateOfBirth,
    createdAt,
    updatedAt,
    gender,
    phoneNumber,
    email,
    address:
      raw.address || buildAddressString(addressRaw) || contactInfoRaw.address || raw.city || '',
    bloodType,
    accountStatus,
    emergencyContacts: raw.emergencyContacts || raw.emergency_contacts,
    insurance: raw.insurance || raw.insuranceInfo || raw.insurance_info,
    personalInfo: {
      fullName: personalInfoRaw.fullName,
      dateOfBirth: personalInfoRaw.dateOfBirth,
      gender: personalInfoRaw.gender,
      nationalId: personalInfoRaw.nationalId,
      nationality: personalInfoRaw.nationality,
      ethnicity: personalInfoRaw.ethnicity,
      occupation: personalInfoRaw.occupation,
      maritalStatus: personalInfoRaw.maritalStatus,
    },
    contactInfo: {
      primaryPhone: contactInfoRaw.primaryPhone || contactInfoRaw.primary_phone,
      secondaryPhone: contactInfoRaw.secondaryPhone || contactInfoRaw.secondary_phone,
      email: contactInfoRaw.email,
      preferredContactMethod: contactInfoRaw.preferredContactMethod,
      address: normalizeAddress(addressRaw),
    },
    basicMedicalInfo: {
      bloodType: basicMedicalInfoRaw.bloodType,
      knownAllergies: basicMedicalInfoRaw.knownAllergies,
      emergencyMedicalInfo: basicMedicalInfoRaw.emergencyMedicalInfo,
    },
  };
}

class PatientService {
  private readonly baseUrl = '/v1/patients';
  private readonly patientIdCache = new Map<string, string>();

  /**
   * Make API request using axios (session-based auth with HTTP-only cookies)
   */
  private async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await apiClient.request<{ success: boolean; data: T }>({
      url,
      method,
      data,
    });
    return response.data.data;
  }

  /**
   * Resolve patient identifier coming from UI (could be PAT- code or user UUID)
   * Always returns canonical patientId (PAT-YYYYMM-XXX)
   */
  private async resolvePatientId(identifier: string): Promise<string> {
    const normalized = identifier?.trim();
    if (!normalized) {
      throw new Error('PATIENT_IDENTIFIER_REQUIRED');
    }

    const cachedValue = this.patientIdCache.get(normalized);
    if (cachedValue) {
      return cachedValue;
    }

    if (this.isPatientCode(normalized)) {
      this.patientIdCache.set(normalized, normalized);
      return normalized;
    }

    if (this.isUuid(normalized)) {
      return normalized;
    }

    // If not UUID and not PAT- code (e.g. username?), try to resolve
    // But for now, let's assume if it's not UUID, it might be a PAT- code or we just use it.
    // The previous logic forced UUID -> PAT- code. We want to allow UUID.

    /*
    const patient = await this.request<Patient>(`/user/${normalized}`);
    if (!patient?.patientId) {
      throw new Error('PATIENT_NOT_FOUND');
    }

    this.patientIdCache.set(normalized, patient.patientId);
    this.patientIdCache.set(patient.patientId, patient.patientId);
    return patient.patientId;
    */
    return normalized;
  }

  private isPatientCode(identifier: string): boolean {
    return /^PAT-/i.test(identifier);
  }

  private isUuid(identifier: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      identifier
    );
  }

  // Emergency Contacts
  async getEmergencyContacts(patientId: string): Promise<{ contacts: EmergencyContact[] }> {
    const resolvedId = await this.resolvePatientId(patientId);
    const res = await this.request<{ contacts?: any[] }>(`/${resolvedId}/emergency-contacts`);
    const contactsArray = Array.isArray(res)
      ? res
      : Array.isArray(res?.contacts)
        ? res.contacts
        : [];

    const mapped = contactsArray.map((contact: any) => ({
      contactId: contact.contactId || contact.id,
      name: contact.name,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber || contact.primaryPhone || contact.primary_phone || '',
      email: contact.email,
      address: contact.address,
      isPrimary: contact.isPrimary ?? contact.is_primary ?? false,
    }));

    return { contacts: mapped };
  }

  async addEmergencyContact(
    patientId: string,
    contact: Omit<EmergencyContact, 'contactId'>
  ): Promise<{ contactId: string }> {
    const resolvedId = await this.resolvePatientId(patientId);
    const payload = {
      name: contact.name,
      relationship: contact.relationship,
      primaryPhone: contact.phoneNumber ?? (contact as any).phone ?? '',
      secondaryPhone: undefined,
      email: contact.email,
      address: contact.address,
      isPrimary: !!contact.isPrimary,
    };
    return await this.request(`/${resolvedId}/emergency-contacts`, 'POST', payload);
  }

  async updateEmergencyContact(
    patientId: string,
    contactId: string,
    contact: Partial<EmergencyContact>
  ): Promise<void> {
    const resolvedId = await this.resolvePatientId(patientId);
    const payload = {
      name: contact.name,
      relationship: contact.relationship,
      primaryPhone: contact.phoneNumber ?? (contact as any).phone ?? '',
      secondaryPhone: undefined,
      email: contact.email,
      address: contact.address,
    };
    await this.request(`/${resolvedId}/emergency-contacts/${contactId}`, 'PUT', payload);
  }

  async deleteEmergencyContact(patientId: string, contactId: string): Promise<void> {
    const resolvedId = await this.resolvePatientId(patientId);
    await this.request(`/${resolvedId}/emergency-contacts/${contactId}`, 'DELETE');
  }

  async setPrimaryContact(patientId: string, contactId: string): Promise<void> {
    const resolvedId = await this.resolvePatientId(patientId);
    await this.request(`/${resolvedId}/emergency-contacts/${contactId}/set-primary`, 'PUT');
  }

  // Insurance
  async getInsurance(patientId: string): Promise<{
    patientId: string;
    insuranceInfo: Insurance | null;
    hasInsurance: boolean;
  }> {
    const resolvedId = await this.resolvePatientId(patientId);
    return await this.request(`/${resolvedId}/insurance`);
  }

  async addInsurance(patientId: string, insurance: Insurance): Promise<void> {
    const resolvedId = await this.resolvePatientId(patientId);
    const payload = {
      provider: insurance.provider,
      policyNumber: insurance.policyNumber,
      groupNumber: insurance.groupNumber,
      validFrom: insurance.validFrom,
      validTo: insurance.validTo,
      coverageType: insurance.coverageType,
      isVietnameseInsurance: ['BHYT', 'BHTN'].includes(insurance.coverageType),
      bhytNumber: insurance.bhytNumber,
      isPrimary: insurance.isPrimary ?? true,
      isActive: insurance.isActive ?? true,
    };
    await this.request(`/${resolvedId}/insurance`, 'POST', payload);
  }

  async updateInsurance(patientId: string, insurance: Insurance): Promise<void> {
    const resolvedId = await this.resolvePatientId(patientId);
    const payload = {
      isActive: insurance.isActive ?? true,
      isPrimary: insurance.isPrimary ?? true,
    };
    await this.request(`/${resolvedId}/insurance`, 'PUT', payload);
  }

  async verifyInsurance(
    patientId: string
  ): Promise<{ isValid: boolean; message: string; expiresAt?: string }> {
    const resolvedId = await this.resolvePatientId(patientId);
    return await this.request(`/${resolvedId}/insurance/verify`, 'POST');
  }

  // Consents
  async getConsents(patientId: string): Promise<{ consents: Consent[] }> {
    const resolvedId = await this.resolvePatientId(patientId);
    return await this.request(`/${resolvedId}/consents`);
  }

  async getActiveConsents(patientId: string): Promise<{ consents: Consent[] }> {
    const resolvedId = await this.resolvePatientId(patientId);
    return await this.request(`/${resolvedId}/consents/active`);
  }

  async grantConsent(
    patientId: string,
    consentType: Consent['consentType'],
    expiresAt?: string
  ): Promise<{ consentId: string }> {
    const resolvedId = await this.resolvePatientId(patientId);
    return await this.request(`/${resolvedId}/consents`, 'POST', { consentType, expiresAt });
  }

  async revokeConsent(patientId: string, consentId: string, reason: string): Promise<void> {
    const resolvedId = await this.resolvePatientId(patientId);
    await this.request(`/${resolvedId}/consents/${consentId}/revoke`, 'POST', { reason });
  }

  // Communication Preferences
  async getCommunicationPreferences(
    patientId: string
  ): Promise<{ preferences: CommunicationPreferences }> {
    const resolvedId = await this.resolvePatientId(patientId);
    return await this.request(`/${resolvedId}/communication`);
  }

  async updateCommunicationPreferences(
    patientId: string,
    preferences: CommunicationPreferences
  ): Promise<void> {
    const resolvedId = await this.resolvePatientId(patientId);
    await this.request(`/${resolvedId}/communication`, 'PUT', preferences);
  }

  // Patient Profile
  async getPatientProfile(patientId: string): Promise<any> {
    const resolvedId = await this.resolvePatientId(patientId);
    return await this.request(`/${resolvedId}`);
  }

  async updatePatientProfile(patientId: string, data: any): Promise<void> {
    const resolvedId = await this.resolvePatientId(patientId);
    await this.request(`/${resolvedId}`, 'PUT', data);
  }

  /**
   * Search patients (Admin)
   */
  async searchPatients(params: {
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<{ patients: Patient[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;

    let response;

    // If keyword is provided and valid (>= 2 chars), use search endpoint
    if (params.keyword && params.keyword.trim().length >= 2) {
      response = await apiClient.get<{
        success: boolean;
        data: Patient[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(`${this.baseUrl}/search`, {
        params: {
          searchTerm: params.keyword,
          page,
          limit,
        },
      });
    } else {
      // Otherwise use list endpoint (default view)
      response = await apiClient.get<{
        success: boolean;
        data: Patient[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(`${this.baseUrl}`, {
        params: {
          page,
          limit,
        },
      });
    }

    const mappedPatients = (response.data.data || []).map((p) => normalizePatient(p));

    return {
      patients: mappedPatients,
      total: response.data.pagination?.total || 0,
    };
  }

  async getStatistics(): Promise<PatientStatistics> {
    const response = await apiClient.get<{
      success: boolean;
      data: PatientStatistics;
    }>(`${this.baseUrl}/statistics`);
    return response.data.data;
  }
}

/**
 * Get patient by ID
 */
export async function getPatientById(patientId: string): Promise<Patient> {
  const response = await apiClient.get<{ success: boolean; data: Patient }>(
    `/v1/patients/${patientId}`
  );
  return normalizePatient(response.data.data);
}

/**
 * Get patient by user ID (for authentication mapping)
 * Maps Supabase user ID to Patient ID
 */
export async function getPatientByUserId(userId: string): Promise<Patient> {
  const response = await apiClient.get<{ success: boolean; data: Patient }>(
    `/v1/patients/user/${userId}`
  );
  return normalizePatient(response.data.data);
}

export const patientService = new PatientService();
