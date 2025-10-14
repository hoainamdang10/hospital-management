/**
 * Mock Factories for Testing
 * Factory functions for creating mock objects
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ILogger } from '../../src/domain/interfaces/ILogger';
import { IProviderStaffRepository } from '../../src/domain/repositories/IProviderStaffRepository';

/**
 * Create mock logger
 */
export function createMockLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn()
  };
}

/**
 * Create mock staff repository
 */
export function createMockStaffRepository(): jest.Mocked<IProviderStaffRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByLicenseNumber: jest.fn(),
    findByDepartment: jest.fn(),
    findBySpecialization: jest.fn(),
    findByStaffType: jest.fn(),
    search: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    count: jest.fn()
  } as any;
}

/**
 * Create mock event publisher
 */
export function createMockEventPublisher() {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(undefined),
    publishAll: jest.fn().mockResolvedValue(undefined),
    isReady: jest.fn().mockReturnValue(true)
  };
}

/**
 * Create mock event handler
 */
export function createMockEventHandler() {
  return {
    handle: jest.fn().mockResolvedValue(undefined),
    handleStaffRegistered: jest.fn().mockResolvedValue(undefined),
    handleStaffUpdated: jest.fn().mockResolvedValue(undefined),
    handleDoctorAvailabilityChanged: jest.fn().mockResolvedValue(undefined),
    handleStaffStatusChanged: jest.fn().mockResolvedValue(undefined)
  };
}

/**
 * Create mock Supabase client
 */
export function createMockSupabaseClient() {
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();
  const mockIn = jest.fn();
  const mockOrder = jest.fn();
  const mockLimit = jest.fn();
  const mockRange = jest.fn();

  // Chain methods
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
    in: mockIn,
    order: mockOrder,
    limit: mockLimit,
    range: mockRange,
    single: mockSingle
  });

  mockInsert.mockReturnValue({
    select: mockSelect,
    single: mockSingle
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
    select: mockSelect
  });

  mockDelete.mockReturnValue({
    eq: mockEq,
    in: mockIn
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    select: mockSelect,
    eq: mockEq
  });

  mockIn.mockReturnValue({
    select: mockSelect
  });

  mockOrder.mockReturnValue({
    limit: mockLimit,
    range: mockRange
  });

  mockLimit.mockReturnValue({
    range: mockRange
  });

  mockSingle.mockResolvedValue({
    data: null,
    error: null
  });

  return {
    from: mockFrom,
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn()
    },
    rpc: jest.fn()
  };
}

/**
 * Create mock staff entity
 */
export function createMockStaff(overrides: any = {}) {
  return {
    id: {
      value: overrides.staffId || 'STF-202501-001'
    },
    userId: {
      value: overrides.userId || 'user-123'
    },
    staffType: overrides.staffType || 'doctor',
    personalInfo: {
      fullName: overrides.fullName || 'Bác sĩ Nguyễn Văn Test',
      dateOfBirth: new Date(overrides.dateOfBirth || '1985-01-01'),
      gender: overrides.gender || 'male',
      nationalId: overrides.nationalId || '001234567890',
      phoneNumber: overrides.phoneNumber || '0901234567',
      email: overrides.email || 'test@hospital.vn'
    },
    professionalInfo: {
      licenseNumber: overrides.licenseNumber || 'BYS-12345',
      specialization: overrides.specialization || 'Nội khoa',
      department: overrides.department || 'Khoa Nội',
      yearsOfExperience: overrides.yearsOfExperience || 10,
      consultationFee: overrides.consultationFee || 500000
    },
    status: overrides.status || 'active',
    isAcceptingNewPatients: overrides.isAcceptingNewPatients !== undefined ? overrides.isAcceptingNewPatients : true,
    workSchedule: overrides.workSchedule || null,
    credentials: overrides.credentials || [],
    createdAt: new Date(overrides.createdAt || Date.now()),
    updatedAt: new Date(overrides.updatedAt || Date.now()),
    getDomainEvents: jest.fn().mockReturnValue([]),
    clearDomainEvents: jest.fn(),
    updatePersonalInfo: jest.fn(),
    updateProfessionalInfo: jest.fn(),
    updateWorkSchedule: jest.fn(),
    addCredential: jest.fn(),
    changeStatus: jest.fn(),
    setAcceptingNewPatients: jest.fn(),
    ...overrides
  };
}

/**
 * Create mock domain event
 */
export function createMockDomainEvent(eventType: string, data: any = {}) {
  return {
    eventId: `evt-${Date.now()}`,
    eventType,
    aggregateId: data.aggregateId || 'STF-202501-001',
    aggregateType: 'Staff',
    occurredAt: new Date(),
    eventData: data,
    ...data
  };
}

/**
 * Create mock integration event
 */
export function createMockIntegrationEvent(eventType: string, data: any = {}) {
  return {
    eventId: `evt-${Date.now()}`,
    eventType,
    aggregateId: data.aggregateId || 'STF-202501-001',
    aggregateType: 'Staff',
    occurredAt: new Date(),
    serviceName: 'provider-staff-service',
    eventData: data,
    metadata: {
      priority: 'normal',
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'staff_management',
      vietnameseDescription: 'Sự kiện quản lý nhân viên y tế'
    },
    ...data
  };
}

/**
 * Create mock use case request
 */
export function createMockRegisterStaffRequest(overrides: any = {}) {
  return {
    userId: overrides.userId || 'user-123',
    staffType: overrides.staffType || 'doctor',
    personalInfo: {
      fullName: overrides.fullName || 'Bác sĩ Nguyễn Văn Test',
      dateOfBirth: overrides.dateOfBirth || '1985-01-01',
      gender: overrides.gender || 'male',
      nationalId: overrides.nationalId || '001234567890',
      phoneNumber: overrides.phoneNumber || '0901234567',
      email: overrides.email || 'test@hospital.vn'
    },
    professionalInfo: {
      licenseNumber: overrides.licenseNumber || 'BYS-12345',
      specialization: overrides.specialization || 'Nội khoa',
      department: overrides.department || 'Khoa Nội',
      yearsOfExperience: overrides.yearsOfExperience || 10,
      consultationFee: overrides.consultationFee || 500000
    },
    ...overrides
  };
}

/**
 * Create mock update staff request
 */
export function createMockUpdateStaffRequest(overrides: any = {}) {
  return {
    staffId: overrides.staffId || 'STF-202501-001',
    personalInfo: overrides.personalInfo,
    professionalInfo: overrides.professionalInfo,
    workSchedule: overrides.workSchedule,
    ...overrides
  };
}

