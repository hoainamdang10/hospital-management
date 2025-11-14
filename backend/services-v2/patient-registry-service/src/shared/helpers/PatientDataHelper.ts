/**
 * Patient Data Helper
 * Utility functions for patient data processing with smart defaults
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Progressive Profiling
 */

import { UNUPDATED, getValueOrDefault } from '../constants/PatientConstants';
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
export const buildPersonalInfoForCreate = (
  data: Partial<RegisterPatientRequest>
): CreatePersonalInfo => ({
  fullName: data.fullName || UNUPDATED,
  dateOfBirth: data.dateOfBirth || UNUPDATED,
  gender: data.gender || UNUPDATED,
  nationalId: data.nationalId || UNUPDATED,
  nationality: getValueOrDefault(data.nationality),
  ethnicity: getValueOrDefault(data.ethnicity),
  occupation: getValueOrDefault(data.occupation),
  maritalStatus: getValueOrDefault(data.maritalStatus),
});

/**
 * Build contact info for CREATE operations
 * Uses "Chưa cập nhật" for missing fields
 */
export const buildContactInfoForCreate = (
  data: Partial<RegisterPatientRequest>
): CreateContactInfo => ({
  primaryPhone: data.primaryPhone || UNUPDATED,
  secondaryPhone: data.secondaryPhone,
  email: data.email || UNUPDATED,
  preferredContactMethod: data.preferredContactMethod || 'phone',
  address: {
    street: getValueOrDefault(data.address?.street),
    ward: getValueOrDefault(data.address?.ward),
    district: getValueOrDefault(data.address?.district),
    city: getValueOrDefault(data.address?.city),
    province: getValueOrDefault(data.address?.province),
    postalCode: data.address?.postalCode,
    country: getValueOrDefault(data.address?.country, 'Vietnam'),
  },
});

/**
 * Merge personal info for UPDATE operations
 * Distinguishes between undefined (no change) and explicit values
 */
export const mergePersonalInfoForUpdate = (
  existing: CreatePersonalInfo,
  dto: Partial<UpdatePatientRequest>
): CreatePersonalInfo => ({
  fullName: dto.fullName !== undefined ? dto.fullName : existing.fullName,
  dateOfBirth: dto.dateOfBirth !== undefined ? dto.dateOfBirth : existing.dateOfBirth,
  gender: dto.gender !== undefined ? dto.gender : existing.gender,
  nationalId: dto.nationalId !== undefined ? dto.nationalId : existing.nationalId,
  nationality: dto.nationality !== undefined ? dto.nationality : existing.nationality,
  ethnicity: dto.ethnicity !== undefined ? dto.ethnicity : existing.ethnicity,
  occupation: dto.occupation !== undefined ? dto.occupation : existing.occupation,
  maritalStatus: dto.maritalStatus !== undefined ? dto.maritalStatus : existing.maritalStatus,
});

/**
 * Merge contact info for UPDATE operations
 * Distinguishes between undefined (no change) and explicit values
 */
export const mergeContactInfoForUpdate = (
  existing: CreateContactInfo,
  dto: Partial<UpdatePatientRequest>
): CreateContactInfo => ({
  primaryPhone: dto.primaryPhone !== undefined ? dto.primaryPhone : existing.primaryPhone,
  secondaryPhone: dto.secondaryPhone !== undefined ? dto.secondaryPhone : existing.secondaryPhone,
  email: dto.email !== undefined ? dto.email : existing.email,
  preferredContactMethod: dto.preferredContactMethod !== undefined 
    ? dto.preferredContactMethod 
    : existing.preferredContactMethod,
  address: {
    street: dto.address?.street !== undefined ? dto.address.street : existing.address.street,
    ward: dto.address?.ward !== undefined ? dto.address.ward : existing.address.ward,
    district: dto.address?.district !== undefined ? dto.address.district : existing.address.district,
    city: dto.address?.city !== undefined ? dto.address.city : existing.address.city,
    province: dto.address?.province !== undefined ? dto.address.province : existing.address.province,
    postalCode: dto.address?.postalCode !== undefined ? dto.address.postalCode : existing.address.postalCode,
    country: dto.address?.country !== undefined ? dto.address.country : existing.address.country,
  },
});

/**
 * Check if personal info has changed
 */
export const hasPersonalInfoChanged = (
  existing: CreatePersonalInfo,
  updated: CreatePersonalInfo
): boolean => {
  return JSON.stringify(existing) !== JSON.stringify(updated);
};

/**
 * Check if contact info has changed
 */
export const hasContactInfoChanged = (
  existing: CreateContactInfo,
  updated: CreateContactInfo
): boolean => {
  return JSON.stringify(existing) !== JSON.stringify(updated);
};

/**
 * Get missing fields list for UI prompts
 */
export const getMissingFields = (personalInfo: CreatePersonalInfo): string[] => {
  return Object.entries(personalInfo)
    .filter(([_, value]) => value === UNUPDATED)
    .map(([key]) => key);
};

/**
 * Calculate profile completion percentage
 */
export const calculateProfileCompletion = (personalInfo: CreatePersonalInfo): number => {
  const totalFields = Object.keys(personalInfo).length;
  const completedFields = Object.values(personalInfo).filter(value => value !== UNUPDATED).length;
  return Math.round((completedFields / totalFields) * 100);
};
