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

  // Emergency Contacts
  async getEmergencyContacts(patientId: string): Promise<{ contacts: EmergencyContact[] }> {
    return await this.request(`/${patientId}/emergency-contacts`);
  }

  async addEmergencyContact(
    patientId: string,
    contact: Omit<EmergencyContact, 'contactId'>
  ): Promise<{ contactId: string }> {
    return await this.request(`/${patientId}/emergency-contacts`, 'POST', contact);
  }

  async updateEmergencyContact(
    patientId: string,
    contactId: string,
    contact: Partial<EmergencyContact>
  ): Promise<void> {
    await this.request(`/${patientId}/emergency-contacts/${contactId}`, 'PUT', contact);
  }

  async deleteEmergencyContact(patientId: string, contactId: string): Promise<void> {
    await this.request(`/${patientId}/emergency-contacts/${contactId}`, 'DELETE');
  }

  async setPrimaryContact(patientId: string, contactId: string): Promise<void> {
    await this.request(`/${patientId}/emergency-contacts/${contactId}/set-primary`, 'PUT');
  }

  // Insurance
  async getInsurance(patientId: string): Promise<{ insuranceInfo: Insurance }> {
    return await this.request(`/${patientId}/insurance`);
  }

  async updateInsurance(patientId: string, insurance: Insurance): Promise<void> {
    await this.request(`/${patientId}/insurance`, 'PUT', insurance);
  }

  async verifyInsurance(
    patientId: string
  ): Promise<{ isValid: boolean; message: string; expiresAt?: string }> {
    return await this.request(`/${patientId}/insurance/verify`, 'POST');
  }

  // Consents
  async getConsents(patientId: string): Promise<{ consents: Consent[] }> {
    return await this.request(`/${patientId}/consents`);
  }

  async getActiveConsents(patientId: string): Promise<{ consents: Consent[] }> {
    return await this.request(`/${patientId}/consents/active`);
  }

  async grantConsent(
    patientId: string,
    consentType: Consent['consentType'],
    expiresAt?: string
  ): Promise<{ consentId: string }> {
    return await this.request(`/${patientId}/consents`, 'POST', { consentType, expiresAt });
  }

  async revokeConsent(
    patientId: string,
    consentId: string,
    reason: string
  ): Promise<void> {
    await this.request(`/${patientId}/consents/${consentId}/revoke`, 'POST', { reason });
  }

  // Communication Preferences
  async getCommunicationPreferences(
    patientId: string
  ): Promise<{ preferences: CommunicationPreferences }> {
    return await this.request(`/${patientId}/communication`);
  }

  async updateCommunicationPreferences(
    patientId: string,
    preferences: CommunicationPreferences
  ): Promise<void> {
    await this.request(`/${patientId}/communication`, 'PUT', preferences);
  }

  // Patient Profile
  async getPatientProfile(patientId: string): Promise<any> {
    return await this.request(`/${patientId}`);
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
