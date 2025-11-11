/**
 * Patient API Service
 * Handles all patient-related API calls
 */

import { API_CONFIG } from '@/lib/constants';
import apiClient from './client';

const BASE_URL = `${API_CONFIG.BASE_URL}/v1/patients`;

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
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Emergency Contacts
  async getEmergencyContacts(patientId: string): Promise<{ contacts: EmergencyContact[] }> {
    const result = await this.request(`/${patientId}/emergency-contacts`);
    return result.data;
  }

  async addEmergencyContact(
    patientId: string,
    contact: Omit<EmergencyContact, 'contactId'>
  ): Promise<{ contactId: string }> {
    const result = await this.request(`/${patientId}/emergency-contacts`, {
      method: 'POST',
      body: JSON.stringify(contact),
    });
    return result.data;
  }

  async updateEmergencyContact(
    patientId: string,
    contactId: string,
    contact: Partial<EmergencyContact>
  ): Promise<void> {
    await this.request(`/${patientId}/emergency-contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  async deleteEmergencyContact(patientId: string, contactId: string): Promise<void> {
    await this.request(`/${patientId}/emergency-contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  async setPrimaryContact(patientId: string, contactId: string): Promise<void> {
    await this.request(`/${patientId}/emergency-contacts/${contactId}/set-primary`, {
      method: 'PUT',
    });
  }

  // Insurance
  async getInsurance(patientId: string): Promise<{ insuranceInfo: Insurance }> {
    const result = await this.request(`/${patientId}/insurance`);
    return result.data;
  }

  async updateInsurance(patientId: string, insurance: Insurance): Promise<void> {
    await this.request(`/${patientId}/insurance`, {
      method: 'PUT',
      body: JSON.stringify(insurance),
    });
  }

  async verifyInsurance(
    patientId: string
  ): Promise<{ isValid: boolean; message: string; expiresAt?: string }> {
    const result = await this.request(`/${patientId}/insurance/verify`, {
      method: 'POST',
    });
    return result.data;
  }

  // Consents
  async getConsents(patientId: string): Promise<{ consents: Consent[] }> {
    const result = await this.request(`/${patientId}/consents`);
    return result.data;
  }

  async getActiveConsents(patientId: string): Promise<{ consents: Consent[] }> {
    const result = await this.request(`/${patientId}/consents/active`);
    return result.data;
  }

  async grantConsent(
    patientId: string,
    consentType: Consent['consentType'],
    expiresAt?: string
  ): Promise<{ consentId: string }> {
    const result = await this.request(`/${patientId}/consents`, {
      method: 'POST',
      body: JSON.stringify({ consentType, expiresAt }),
    });
    return result.data;
  }

  async revokeConsent(
    patientId: string,
    consentId: string,
    reason: string
  ): Promise<void> {
    await this.request(`/${patientId}/consents/${consentId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Communication Preferences
  async getCommunicationPreferences(
    patientId: string
  ): Promise<{ preferences: CommunicationPreferences }> {
    const result = await this.request(`/${patientId}/communication`);
    return result.data;
  }

  async updateCommunicationPreferences(
    patientId: string,
    preferences: CommunicationPreferences
  ): Promise<void> {
    await this.request(`/${patientId}/communication`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Patient Profile
  async getPatientProfile(patientId: string): Promise<any> {
    const result = await this.request(`/${patientId}`);
    return result.data;
  }
}

/**
 * Get patient by ID
 */
export async function getPatientById(patientId: string): Promise<Patient> {
  const response = await fetch(`${BASE_URL}/${patientId}`);
  return response.json();
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
