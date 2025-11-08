/**
 * Profile Types
 * Types for patient profile management
 */

export interface PatientProfile {
  id: string;
  // Basic Info
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType?: string;
  
  // Contact Info
  email: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
  ward?: string;
  postalCode?: string;
  
  // Emergency Contact
  emergencyContacts: EmergencyContact[];
  
  // Insurance
  insurance?: InsuranceInfo;
  
  // Avatar
  avatar?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validFrom: string;
  validTo: string;
  status: 'active' | 'expired' | 'pending';
  coverageType: string;
  notes?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  postalCode?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  healthTips: boolean;
  promotions: boolean;
}
