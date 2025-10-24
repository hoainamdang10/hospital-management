/**
 * Mock Factories for Testing
 * Factory functions for creating mock objects
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ILogger } from '../../src/application/interfaces/ILogger';
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
    fatal: jest.fn(),
    log: jest.fn()
  };
}

/**
 * Create mock staff repository
 */
export function createMockStaffRepository(): jest.Mocked<IProviderStaffRepository> {
  return {
    save: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByLicenseNumber: jest.fn(),
    findAll: jest.fn(),
    findByDepartment: jest.fn(),
    findBySpecialization: jest.fn(),
    findAvailableStaff: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    count: jest.fn(),
    getStatistics: jest.fn()
  } as jest.Mocked<IProviderStaffRepository>;
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
 * Create test staff entity (actual ProviderStaff instance for unit tests)
 * Returns a real ProviderStaff aggregate, not a mock object
 *
 * @param overrides - Optional properties to override defaults
 * @returns ProviderStaff instance
 */
export function createTestStaff(overrides: any = {}) {
  const { ProviderStaff } = require('../../src/domain/aggregates/ProviderStaff');
  const { StaffId } = require('../../src/domain/value-objects/StaffId');
  const { PersonalInfo } = require('../../src/domain/value-objects/PersonalInfo');
  const { ProfessionalInfo } = require('../../src/domain/value-objects/ProfessionalInfo');
  const { WorkSchedule } = require('../../src/domain/value-objects/WorkSchedule');
  const { Specialization } = require('../../src/domain/entities/Specialization');

  // Create PersonalInfo value object
  const personalInfo = PersonalInfo.create({
    fullName: overrides.fullName || 'Dr. Test Staff',
    dateOfBirth: overrides.dateOfBirth ? new Date(overrides.dateOfBirth) : new Date('1980-01-01'),
    gender: overrides.gender || 'male',
    nationalId: overrides.nationalId || '001234567890',
    phoneNumber: overrides.phoneNumber || '0901234567',
    email: overrides.email || 'test@hospital.vn',
    nationality: overrides.nationality || 'Vietnamese',
    address: {
      street: overrides.street || '123 Test Street',
      ward: overrides.ward || 'Ward 1',
      district: overrides.district || 'District 1',
      city: overrides.city || 'Ho Chi Minh',
      province: overrides.province || 'Ho Chi Minh',
      country: overrides.country || 'Vietnam'
    }
  });

  // Create ProfessionalInfo value object
  const professionalInfo = ProfessionalInfo.create({
    title: overrides.title || 'Dr.',
    department: overrides.department || 'Cardiology Department',
    position: overrides.position || 'Senior Doctor',
    education: overrides.education || ['Doctor of Medicine', 'Bachelor of Medicine'],
    languages: overrides.languages || ['Vietnamese', 'English']
  });

  // Create WorkSchedule value object
  const workSchedule = WorkSchedule.create({
    workingDays: overrides.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: overrides.workingHours || { start: '08:00', end: '17:00' },
    timeZone: overrides.timeZone || 'Asia/Ho_Chi_Minh',
    isFlexible: overrides.isFlexible !== undefined ? overrides.isFlexible : false
  });

  // Create specializations for doctors
  const specializations = overrides.specializations
    ? overrides.specializations
    : (overrides.staffType === 'doctor' || !overrides.staffType
        ? [Specialization.create({
            code: overrides.specializationCode || 'CARD',
            name: overrides.specialization || 'Cardiology',
            description: 'Heart and cardiovascular system specialist',
            isActive: true
          })]
        : []);

  // Create staff using factory method
  const staff = ProviderStaff.create(
    overrides.userId || 'user-test-123',
    overrides.staffType || 'doctor',
    personalInfo,
    professionalInfo,
    workSchedule,
    overrides.licenseNumber || 'BYS-TEST-001',
    overrides.employmentType || 'full_time',
    new Date(overrides.hireDate || '2020-01-01'),
    overrides.yearsOfExperience || 10,
    specializations
  );

  // Override staffId if provided (for testing specific IDs)
  if (overrides.staffId) {
    const parsedStaffId = StaffId.fromString(overrides.staffId);
    (staff as any).props.id = parsedStaffId;
  }

  // Override aggregate UUID if provided, otherwise ensure deterministic value for tests
  (staff as any)._id = overrides.aggregateId || 'aggregate-staff-test';

  // Override status if provided (for testing different states)
  if (overrides.status && overrides.status !== 'active') {
    (staff as any).props.status = overrides.status;
    (staff as any).props.isActive = overrides.status === 'active';
  }

  return staff;
}

/**
 * Create mock domain event
 */
export function createMockDomainEvent(eventType: string, data: any = {}) {
  const {
    metadata: metadataOverrides,
    occurredAt: occurredAtOverride,
    eventId: providedEventId,
    aggregateId,
    aggregateType,
    ...eventPayload
  } = data;

  const metadata = {
    source: 'domain',
    priority: 'normal',
    retryable: true,
    ...metadataOverrides
  };

  const payloadClone = { ...eventPayload };

  return {
    eventId: providedEventId || `evt-${Date.now()}`,
    eventType,
    aggregateId: aggregateId || eventPayload.staffId || 'STF-202501-001',
    aggregateType: aggregateType || 'Staff',
    occurredAt: occurredAtOverride ? new Date(occurredAtOverride) : new Date(),
    metadata,
    eventData: payloadClone,
    getEventData: () => ({ ...payloadClone }),
    containsPHI: () => false,
    getPatientId: () => null,
    ...eventPayload
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
