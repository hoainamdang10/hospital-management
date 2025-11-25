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
  coverageType: 'BHYT' | 'BHTN' | 'COMMERCIAL';
  validFrom: string;
  validTo: string;
  isActive: boolean;
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

export interface Patient {
  patientId: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  email: string;
  address?: string;
  bloodType?: string;
  emergencyContacts?: EmergencyContact[];
  insurance?: Insurance[];
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

    if (!this.isUuid(normalized)) {
      this.patientIdCache.set(normalized, normalized);
      return normalized;
    }

    const patient = await this.request<Patient>(`/user/${normalized}`);
    if (!patient?.patientId) {
      throw new Error('PATIENT_NOT_FOUND');
    }

    this.patientIdCache.set(normalized, patient.patientId);
    this.patientIdCache.set(patient.patientId, patient.patientId);
    return patient.patientId;
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
    return await this.request(`/${resolvedId}/emergency-contacts`);
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
  async getInsurance(patientId: string): Promise<{ insuranceInfo: Insurance }> {
    const resolvedId = await this.resolvePatientId(patientId);
    return await this.request(`/${resolvedId}/insurance`);
  }

  async updateInsurance(patientId: string, insurance: Insurance): Promise<void> {
    const resolvedId = await this.resolvePatientId(patientId);
    await this.request(`/${resolvedId}/insurance`, 'PUT', insurance);
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
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>(
        `${this.baseUrl}/search`,
        {
          params: {
            searchTerm: params.keyword,
            page,
            limit
          }
        }
      );
    } else {
      // Otherwise use list endpoint (default view)
      response = await apiClient.get<{
        success: boolean;
        data: Patient[];
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>(
        `${this.baseUrl}`,
        {
          params: {
            page,
            limit
          }
        }
      );
    }

    return {
      patients: response.data.data,
      total: response.data.pagination?.total || 0
    };
  }
}

/**
 * Get patient by ID
 */
export async function getPatientById(patientId: string): Promise<Patient> {
  const response = await apiClient.get<{ success: boolean; data: Patient }>(
    `/v1/patients/${patientId}`
  );
  return response.data.data;
}

/**
 * Get patient by user ID (for authentication mapping)
 * Maps Supabase user ID to Patient ID
 */
export async function getPatientByUserId(userId: string): Promise<Patient> {
  const response = await apiClient.get<{ success: boolean; data: Patient }>(
    `/v1/patients/user/${userId}`
  );
  return response.data.data;
}

export const patientService = new PatientService();
