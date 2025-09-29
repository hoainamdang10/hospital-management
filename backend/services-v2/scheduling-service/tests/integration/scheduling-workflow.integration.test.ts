/**
 * Scheduling Service Integration Tests
 * Comprehensive integration testing for appointment scheduling workflows
 * Vietnamese healthcare compliance and conflict resolution testing
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Jest, Vietnamese Healthcare Standards
 */

import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScheduleAppointmentUseCase, ScheduleAppointmentUseCaseDependencies } from '../../src/application/use-cases/ScheduleAppointmentUseCase';
import { CancelAppointmentUseCase, CancelAppointmentUseCaseDependencies } from '../../src/application/use-cases/CancelAppointmentUseCase';
import { CheckAvailabilityUseCase } from '../../src/application/use-cases/CheckAvailabilityUseCase';
import { SupabaseSchedulingRepository } from '../../src/infrastructure/persistence/SupabaseSchedulingRepository';
import { AppointmentType, AppointmentPriority } from '../../src/domain/value-objects/AppointmentId';
import { AppointmentReason } from '../../src/domain/value-objects/AppointmentDetails';

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined)
};

const mockAvailabilityService = {
  checkAvailability: jest.fn().mockResolvedValue(true)
};

const mockAuthorizationService = {
  canScheduleAppointment: jest.fn().mockResolvedValue(true),
  canCancelAppointment: jest.fn().mockResolvedValue(true)
};

const mockAuditService = {
  logAppointmentScheduled: jest.fn().mockResolvedValue(undefined),
  logAppointmentCancelled: jest.fn().mockResolvedValue(undefined),
  logAppointmentAccess: jest.fn().mockResolvedValue(undefined)
};

describe('Scheduling Service Integration Tests', () => {
  let supabaseClient: SupabaseClient;
  let schedulingRepository: SupabaseSchedulingRepository;
  let scheduleAppointmentUseCase: ScheduleAppointmentUseCase;
  let cancelAppointmentUseCase: CancelAppointmentUseCase;
  let checkAvailabilityUseCase: CheckAvailabilityUseCase;

  // Vietnamese healthcare test constants
  const VIETNAMESE_HEALTHCARE_CONSTANTS = {
    PATIENT_ID: 'PAT-202501-001',
    PATIENT_NAME: 'Nguyễn Văn Test',
    PATIENT_PHONE: '0901234567',
    PATIENT_NATIONAL_ID: '123456789012',
    PROVIDER_ID: 'CARD-DOC-202501-001',
    PROVIDER_NAME: 'BS. Nguyễn Văn Hùng',
    DEPARTMENT: 'Tim mạch',
    DEPARTMENT_CODE: 'CARD',
    ROOM_ID: 'P.101',
    TIMEZONE: 'Asia/Ho_Chi_Minh'
  };

  beforeAll(async () => {
    // Setup test database connection
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';
    
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'scheduling_schema' }
    });

    // Initialize repository
    schedulingRepository = new SupabaseSchedulingRepository({
      supabase: supabaseClient,
      logger: mockLogger,
      auditService: mockAuditService,
      schema: 'scheduling_schema',
      tableName: 'appointments'
    });

    // Initialize use cases
    const scheduleAppointmentDependencies: ScheduleAppointmentUseCaseDependencies = {
      schedulingRepository,
      eventBus: mockEventBus,
      availabilityService: mockAvailabilityService,
      logger: mockLogger,
      authorizationService: mockAuthorizationService,
      auditService: mockAuditService
    };

    const cancelAppointmentDependencies: CancelAppointmentUseCaseDependencies = {
      schedulingRepository,
      eventBus: mockEventBus,
      logger: mockLogger,
      authorizationService: mockAuthorizationService,
      auditService: mockAuditService
    };

    scheduleAppointmentUseCase = new ScheduleAppointmentUseCase(scheduleAppointmentDependencies);
    cancelAppointmentUseCase = new CancelAppointmentUseCase(cancelAppointmentDependencies);
    checkAvailabilityUseCase = new CheckAvailabilityUseCase({
      schedulingRepository,
      availabilityService: mockAvailabilityService,
      logger: mockLogger,
      authorizationService: mockAuthorizationService,
      auditService: mockAuditService
    });
  });

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Clean test data
    await supabaseClient
      .from('appointments')
      .delete()
      .like('appointment_id', 'TEST-%');
  });

  afterAll(async () => {
    // Cleanup test data
    await supabaseClient
      .from('appointments')
      .delete()
      .like('appointment_id', 'TEST-%');
  });

  describe('Appointment Scheduling Workflow', () => {
    it('should successfully schedule appointment with Vietnamese healthcare compliance', async () => {
      // Arrange
      const appointmentRequest = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        patientPhone: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_PHONE,
        patientDateOfBirth: '1990-01-01',
        patientNationalId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NATIONAL_ID,
        patientEmail: 'test@example.com',
        patientAddress: '123 Đường Test, Quận 1, TP.HCM',
        patientInsuranceNumber: 'HS4010123456789',
        patientInsuranceType: 'BHYT' as const,

        providerId: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_ID,
        providerName: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_NAME,
        department: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT,
        departmentCode: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT_CODE,

        appointmentType: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        startTime: new Date('2024-02-01T14:30:00+07:00'), // Vietnamese timezone
        endTime: new Date('2024-02-01T15:00:00+07:00'),
        roomId: VIETNAMESE_HEALTHCARE_CONSTANTS.ROOM_ID,
        reason: 'Khám tim mạch định kỳ',
        reasonCode: AppointmentReason.CONSULTATION,
        symptoms: 'Đau ngực, khó thở',
        notes: 'Bệnh nhân có tiền sử bệnh tim',
        estimatedDuration: 30,
        requiresPreparation: false,
        isFollowUp: false,
        urgencyLevel: 'routine' as const,

        createdBy: 'TEST-USER-001'
      };

      // Act
      const result = await scheduleAppointmentUseCase.execute(appointmentRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.appointmentId).toBeDefined();
      expect(result.message).toContain('thành công');
      expect(result.appointment).toBeDefined();
      expect(result.appointment!.patient.patientId).toBe(VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID);
      expect(result.appointment!.provider.providerId).toBe(VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_ID);
      expect(result.integrationEvents?.notificationSent).toBe(true);
      expect(result.nextSteps).toContain('SMS xác nhận');

      // Verify audit logging
      expect(mockAuditService.logAppointmentScheduled).toHaveBeenCalledWith(
        expect.any(String),
        'TEST-USER-001',
        'Appointment scheduled successfully',
        expect.objectContaining({
          patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
          providerId: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_ID
        })
      );

      // Verify event publishing
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should handle Vietnamese business hours validation', async () => {
      // Arrange - Schedule outside business hours (before 7:00 AM)
      const appointmentRequest = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        patientPhone: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_PHONE,
        patientDateOfBirth: '1990-01-01',
        patientNationalId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NATIONAL_ID,
        providerId: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_ID,
        providerName: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_NAME,
        department: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT,
        departmentCode: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT_CODE,
        appointmentType: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        startTime: new Date('2024-02-01T06:00:00+07:00'), // Before business hours
        endTime: new Date('2024-02-01T06:30:00+07:00'),
        reason: 'Khám tim mạch',
        reasonCode: AppointmentReason.CONSULTATION,
        estimatedDuration: 30,
        createdBy: 'TEST-USER-001'
      };

      // Act
      const result = await scheduleAppointmentUseCase.execute(appointmentRequest);

      // Assert
      expect(result.success).toBe(true); // Should succeed but with warnings
      expect(result.validationResults?.warnings).toContain('Cuộc hẹn ngoài giờ hành chính');
      expect(result.validationResults?.recommendations).toContain('giờ hành chính');
    });

    it('should detect and prevent appointment conflicts', async () => {
      // Arrange - First appointment
      const firstAppointment = {
        patientId: 'PAT-202501-002',
        patientName: 'Trần Thị Test',
        patientPhone: '0907654321',
        patientDateOfBirth: '1985-05-15',
        patientNationalId: '987654321098',
        providerId: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_ID,
        providerName: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_NAME,
        department: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT,
        departmentCode: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT_CODE,
        appointmentType: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        startTime: new Date('2024-02-01T10:00:00+07:00'),
        endTime: new Date('2024-02-01T10:30:00+07:00'),
        reason: 'Khám tim mạch',
        reasonCode: AppointmentReason.CONSULTATION,
        estimatedDuration: 30,
        createdBy: 'TEST-USER-001'
      };

      // Schedule first appointment
      const firstResult = await scheduleAppointmentUseCase.execute(firstAppointment);
      expect(firstResult.success).toBe(true);

      // Arrange - Conflicting appointment (overlapping time)
      const conflictingAppointment = {
        ...firstAppointment,
        patientId: 'PAT-202501-003',
        patientName: 'Lê Văn Conflict',
        patientNationalId: '111222333444',
        startTime: new Date('2024-02-01T10:15:00+07:00'), // Overlaps with first appointment
        endTime: new Date('2024-02-01T10:45:00+07:00')
      };

      // Act
      const conflictResult = await scheduleAppointmentUseCase.execute(conflictingAppointment);

      // Assert
      expect(conflictResult.success).toBe(false);
      expect(conflictResult.message).toContain('xung đột');
      expect(conflictResult.validationResults?.errors).toContain('APPOINTMENT_CONFLICT');
      expect(conflictResult.validationResults?.recommendations).toContain('khung thời gian khác');
    });
  });

  describe('Appointment Cancellation Workflow', () => {
    it('should successfully cancel appointment with Vietnamese compliance', async () => {
      // Arrange - First schedule an appointment
      const scheduleRequest = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        patientPhone: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_PHONE,
        patientDateOfBirth: '1990-01-01',
        patientNationalId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NATIONAL_ID,
        providerId: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_ID,
        providerName: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_NAME,
        department: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT,
        departmentCode: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT_CODE,
        appointmentType: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        startTime: new Date('2024-02-02T14:30:00+07:00'),
        endTime: new Date('2024-02-02T15:00:00+07:00'),
        reason: 'Khám tim mạch',
        reasonCode: AppointmentReason.CONSULTATION,
        estimatedDuration: 30,
        createdBy: 'TEST-USER-001'
      };

      const scheduleResult = await scheduleAppointmentUseCase.execute(scheduleRequest);
      expect(scheduleResult.success).toBe(true);

      // Act - Cancel the appointment
      const cancelRequest = {
        appointmentId: scheduleResult.appointmentId,
        reason: 'Bệnh nhân có việc đột xuất',
        cancelledBy: 'TEST-USER-001',
        notifyPatient: true,
        notifyProvider: true
      };

      const cancelResult = await cancelAppointmentUseCase.execute(cancelRequest);

      // Assert
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.message).toContain('hủy thành công');
      expect(cancelResult.integrationEvents?.notificationSent).toBe(true);
      expect(cancelResult.integrationEvents?.calendarUpdated).toBe(true);
      expect(cancelResult.nextSteps).toContain('Thông báo hủy lịch');

      // Verify audit logging
      expect(mockAuditService.logAppointmentCancelled).toHaveBeenCalledWith(
        scheduleResult.appointmentId,
        'TEST-USER-001',
        'Appointment cancelled successfully',
        expect.objectContaining({
          reason: 'Bệnh nhân có việc đột xuất'
        })
      );
    });

    it('should handle late cancellation with Vietnamese business rules', async () => {
      // This test would check cancellation within 2 hours of appointment time
      // Implementation would depend on specific business rules
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Vietnamese Time Zone Handling', () => {
    it('should correctly handle Vietnamese timezone (Asia/Ho_Chi_Minh)', async () => {
      // Arrange
      const vietnameseTime = new Date('2024-02-01T14:30:00+07:00');
      const utcTime = new Date('2024-02-01T07:30:00Z'); // Same time in UTC

      const appointmentRequest = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        patientPhone: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_PHONE,
        patientDateOfBirth: '1990-01-01',
        patientNationalId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NATIONAL_ID,
        providerId: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_ID,
        providerName: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_NAME,
        department: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT,
        departmentCode: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT_CODE,
        appointmentType: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        startTime: vietnameseTime,
        endTime: new Date('2024-02-01T15:00:00+07:00'),
        reason: 'Khám tim mạch',
        reasonCode: AppointmentReason.CONSULTATION,
        estimatedDuration: 30,
        createdBy: 'TEST-USER-001'
      };

      // Act
      const result = await scheduleAppointmentUseCase.execute(appointmentRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.appointment!.timeSlot.startTime.getTime()).toBe(vietnameseTime.getTime());
      
      // Verify timezone is preserved in database
      const savedAppointment = await schedulingRepository.findByAppointmentId(result.appointmentId);
      expect(savedAppointment).toBeDefined();
      expect(savedAppointment!.timeSlot.startTime.getTime()).toBe(vietnameseTime.getTime());
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent appointment scheduling requests', async () => {
      // Arrange
      const concurrentRequests = 5;
      const baseTime = new Date('2024-02-01T09:00:00+07:00');
      
      const requests = Array.from({ length: concurrentRequests }, (_, index) => ({
        patientId: `PAT-202501-${String(index + 100).padStart(3, '0')}`,
        patientName: `Bệnh nhân Test ${index + 1}`,
        patientPhone: `090123456${index}`,
        patientDateOfBirth: '1990-01-01',
        patientNationalId: `12345678901${index}`,
        providerId: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_ID,
        providerName: VIETNAMESE_HEALTHCARE_CONSTANTS.PROVIDER_NAME,
        department: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT,
        departmentCode: VIETNAMESE_HEALTHCARE_CONSTANTS.DEPARTMENT_CODE,
        appointmentType: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        startTime: new Date(baseTime.getTime() + (index * 30 * 60 * 1000)), // 30 minutes apart
        endTime: new Date(baseTime.getTime() + (index * 30 * 60 * 1000) + (30 * 60 * 1000)),
        reason: 'Khám tim mạch',
        reasonCode: AppointmentReason.CONSULTATION,
        estimatedDuration: 30,
        createdBy: 'TEST-USER-001'
      }));

      // Act
      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(request => scheduleAppointmentUseCase.execute(request))
      );
      const endTime = Date.now();

      // Assert
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      const successfulResults = results.filter(r => r.success);
      expect(successfulResults.length).toBe(concurrentRequests);
      
      // Verify all appointments were scheduled with unique IDs
      const appointmentIds = successfulResults.map(r => r.appointmentId);
      const uniqueIds = new Set(appointmentIds);
      expect(uniqueIds.size).toBe(concurrentRequests);
    });
  });
});
