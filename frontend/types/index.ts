/**
 * Common TypeScript Types and Interfaces
 */

import { USER_ROLES, APPOINTMENT_STATUS, INVOICE_STATUS } from '@/lib/constants';

// User Types
export interface User {
  id: string;
  email: string;
  role: keyof typeof USER_ROLES;
  isActive: boolean;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

// Patient Types
export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phoneNumber: string;
  email: string;
  address?: string;
  cccd?: string;
  bhytCode?: string;
  insuranceType?: 'BHYT' | 'BHTN' | 'NONE';
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Doctor/Provider Types
export interface Provider {
  id: string;
  staffId: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  education?: string;
  experience?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: keyof typeof APPOINTMENT_STATUS;
  type: string;
  reason?: string;
  notes?: string;
  patient?: Patient;
  provider?: Provider;
  createdAt: string;
  updatedAt: string;
}

// Medical Record Types
export interface MedicalRecord {
  id: string;
  patientId: string;
  providerId: string;
  appointmentId?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  vitalSigns?: VitalSigns;
  createdAt: string;
  updatedAt: string;
}

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

// Invoice/Billing Types
export interface Invoice {
  id: string;
  patientId: string;
  appointmentId?: string;
  invoiceNumber: string;
  status: keyof typeof INVOICE_STATUS;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serviceCode?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

// Table Types
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}

// Filter Types
export interface FilterOption {
  label: string;
  value: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Chart Types
export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

// Route Guard Types
export interface RouteGuard {
  allowedRoles?: (keyof typeof USER_ROLES)[];
  requireAuth?: boolean;
  redirectTo?: string;
}
