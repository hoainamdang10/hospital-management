/**
 * Test Data Factory - Testing Utilities
 * V2 Clean Architecture + DDD Implementation
 * Factory for creating consistent test data
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Appointment, AppointmentStatus } from '../../src/domain/aggregates/scheduling.aggregate';
import { AppointmentId, AppointmentType, AppointmentPriority } from '../../src/domain/value-objects/AppointmentId';
import { PatientInfo } from '../../src/domain/value-objects/PatientInfo';
import { ProviderInfo, ProviderType, ProviderStatus } from '../../src/domain/value-objects/ProviderInfo';
import { TimeSlot, TimeSlotStatus } from '../../src/domain/value-objects/TimeSlot';
import { AppointmentDetails, AppointmentReason } from '../../src/domain/value-objects/AppointmentDetails';
import { ScheduleAppointmentCommand } from '../../src/application/commands/ScheduleAppointmentCommand';
import { TEST_CONSTANTS } from '../setup';

/**
 * Test Data Factory
 * Provides consistent test data creation methods
 */
export class TestDataFactory {
  
  /**
   * Create test AppointmentId
   */
  static createAppointmentId(overrides: Partial<{
    type: AppointmentType;
    departmentCode: string;
    priority: AppointmentPriority;
  }> = {}): AppointmentId {
    return AppointmentId.create(
      overrides.type || AppointmentType.CONSULTATION,
      overrides.departmentCode || 'CARD',
      overrides.priority || AppointmentPriority.NORMAL
    );
  }

  /**
   * Create test PatientInfo
   */
  static createPatientInfo(overrides: Partial<{
    patientId: string;
    fullName: string;
    phone: string;
    dateOfBirth: string;
    nationalId: string;
    email?: string;
    address?: string;
    emergencyContact?: string;
    insuranceNumber?: string;
    insuranceType?: string;
  }> = {}): PatientInfo {
    return PatientInfo.create(
      overrides.patientId || TEST_CONSTANTS.PATIENT.ID,
      overrides.fullName || TEST_CONSTANTS.PATIENT.NAME,
      overrides.phone || TEST_CONSTANTS.PATIENT.PHONE,
      overrides.dateOfBirth || TEST_CONSTANTS.PATIENT.DATE_OF_BIRTH,
      overrides.nationalId || TEST_CONSTANTS.PATIENT.NATIONAL_ID,
      overrides.email || TEST_CONSTANTS.PATIENT.EMAIL,
      overrides.address || '123 Đường ABC, Quận 1, TP.HCM',
      overrides.emergencyContact || '0987654321',
      overrides.insuranceNumber || 'VN1234567890123',
      overrides.insuranceType || 'BHYT'
    );
  }

  /**
   * Create test ProviderInfo
   */
  static createProviderInfo(overrides: Partial<{
    providerId: string;
    fullName: string;
    specialization: string;
    department: string;
    licenseNumber: string;
    type: ProviderType;
    status: ProviderStatus;
    phone?: string;
    email?: string;
  }> = {}): ProviderInfo {
    return ProviderInfo.create(
      overrides.providerId || TEST_CONSTANTS.PROVIDER.ID,
      overrides.fullName || TEST_CONSTANTS.PROVIDER.NAME,
      overrides.specialization || TEST_CONSTANTS.PROVIDER.SPECIALIZATION,
      overrides.department || TEST_CONSTANTS.PROVIDER.DEPARTMENT,
      overrides.licenseNumber || TEST_CONSTANTS.PROVIDER.LICENSE,
      overrides.type || ProviderType.DOCTOR,
      overrides.status || ProviderStatus.ACTIVE,
      overrides.phone || '0123456788',
      overrides.email || 'doctor@test.com'
    );
  }

  /**
   * Create test TimeSlot
   */
  static createTimeSlot(overrides: Partial<{
    startTime: Date;
    endTime: Date;
    status: TimeSlotStatus;
  }> = {}): TimeSlot {
    const startTime = overrides.startTime || TEST_CONSTANTS.DATES.TOMORROW;
    const endTime = overrides.endTime || new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes later
    
    return TimeSlot.create(
      startTime,
      endTime,
      overrides.status || TimeSlotStatus.AVAILABLE
    );
  }

  /**
   * Create test AppointmentDetails
   */
  static createAppointmentDetails(overrides: Partial<{
    reason: string;
    estimatedDuration: number;
    requiresPreparation: boolean;
    isFollowUp: boolean;
    urgencyLevel: string;
    reasonCode: AppointmentReason;
    symptoms?: string;
    notes?: string;
    preparationInstructions?: string;
    specialRequirements?: string[];
    interpreterRequired?: boolean;
    wheelchairAccessible?: boolean;
    fasting?: boolean;
    medicationRestrictions?: string[];
  }> = {}): AppointmentDetails {
    return AppointmentDetails.create(
      overrides.reason || TEST_CONSTANTS.APPOINTMENT.REASON,
      overrides.estimatedDuration || TEST_CONSTANTS.APPOINTMENT.DURATION,
      overrides.requiresPreparation || false,
      overrides.isFollowUp || false,
      overrides.urgencyLevel || TEST_CONSTANTS.APPOINTMENT.URGENCY_LEVEL,
      overrides.reasonCode || AppointmentReason.CONSULTATION,
      overrides.symptoms || 'Đau ngực, khó thở',
      overrides.notes || 'Bệnh nhân cần theo dõi đặc biệt',
      overrides.preparationInstructions || 'Nhịn ăn 8 tiếng trước khám',
      overrides.specialRequirements || ['wheelchair_access'],
      overrides.interpreterRequired || false,
      overrides.wheelchairAccessible || false,
      overrides.fasting || false,
      overrides.medicationRestrictions || ['aspirin']
    );
  }

  /**
   * Create test Appointment
   */
  static createAppointment(overrides: Partial<{
    appointmentId?: AppointmentId;
    patient?: PatientInfo;
    provider?: ProviderInfo;
    timeSlot?: TimeSlot;
    details?: AppointmentDetails;
    roomId?: string;
    createdBy?: string;
    status?: AppointmentStatus;
  }> = {}): Appointment {
    const appointmentId = overrides.appointmentId || this.createAppointmentId();
    const patient = overrides.patient || this.createPatientInfo();
    const provider = overrides.provider || this.createProviderInfo();
    const timeSlot = overrides.timeSlot || this.createTimeSlot();
    const details = overrides.details || this.createAppointmentDetails();
    const roomId = overrides.roomId || TEST_CONSTANTS.APPOINTMENT.ROOM_ID;
    const createdBy = overrides.createdBy || 'test-user';

    const appointment = Appointment.create(
      appointmentId,
      patient,
      provider,
      timeSlot,
      details,
      roomId,
      createdBy
    );

    // Set status if provided
    if (overrides.status && overrides.status !== AppointmentStatus.SCHEDULED) {
      switch (overrides.status) {
        case AppointmentStatus.CONFIRMED:
          appointment.confirm('test-user');
          break;
        case AppointmentStatus.IN_PROGRESS:
          appointment.confirm('test-user');
          appointment.start('test-user');
          break;
        case AppointmentStatus.COMPLETED:
          appointment.confirm('test-user');
          appointment.start('test-user');
          appointment.complete('test-user', 'Khám xong, bệnh nhân khỏe mạnh');
          break;
        case AppointmentStatus.CANCELLED:
          appointment.cancel('test-user', 'Bệnh nhân hủy lịch');
          break;
        case AppointmentStatus.NO_SHOW:
          appointment.confirm('test-user');
          appointment.markNoShow('test-user', 'Bệnh nhân không đến');
          break;
      }
    }

    return appointment;
  }

  /**
   * Create test ScheduleAppointmentCommand
   */
  static createScheduleAppointmentCommand(overrides: Partial<{
    appointmentId?: AppointmentId;
    patient?: PatientInfo;
    provider?: ProviderInfo;
    timeSlot?: TimeSlot;
    details?: AppointmentDetails;
    roomId?: string;
    createdBy?: string;
  }> = {}): ScheduleAppointmentCommand {
    return new ScheduleAppointmentCommand(
      overrides.appointmentId || this.createAppointmentId(),
      overrides.patient || this.createPatientInfo(),
      overrides.provider || this.createProviderInfo(),
      overrides.timeSlot || this.createTimeSlot(),
      overrides.details || this.createAppointmentDetails(),
      overrides.roomId || TEST_CONSTANTS.APPOINTMENT.ROOM_ID,
      overrides.createdBy || 'test-user'
    );
  }

  /**
   * Create multiple test appointments
   */
  static createMultipleAppointments(count: number, baseOverrides: any = {}): Appointment[] {
    const appointments: Appointment[] = [];
    
    for (let i = 0; i < count; i++) {
      const overrides = {
        ...baseOverrides,
        patient: this.createPatientInfo({
          patientId: `PAT-202412-${String(i + 1).padStart(3, '0')}`,
          fullName: `Bệnh nhân ${i + 1}`,
          phone: `012345${String(i).padStart(4, '0')}`
        }),
        timeSlot: this.createTimeSlot({
          startTime: new Date(TEST_CONSTANTS.DATES.TOMORROW.getTime() + i * 60 * 60 * 1000), // Each appointment 1 hour apart
          endTime: new Date(TEST_CONSTANTS.DATES.TOMORROW.getTime() + i * 60 * 60 * 1000 + 30 * 60 * 1000) // 30 minutes duration
        })
      };
      
      appointments.push(this.createAppointment(overrides));
    }
    
    return appointments;
  }

  /**
   * Create conflicting appointments (overlapping time slots)
   */
  static createConflictingAppointments(): { appointment1: Appointment; appointment2: Appointment } {
    const baseTimeSlot = this.createTimeSlot();
    
    // Second appointment starts 15 minutes after first but before first ends
    const conflictingTimeSlot = this.createTimeSlot({
      startTime: new Date(baseTimeSlot.startTime.getTime() + 15 * 60 * 1000),
      endTime: new Date(baseTimeSlot.startTime.getTime() + 45 * 60 * 1000)
    });

    const appointment1 = this.createAppointment({ timeSlot: baseTimeSlot });
    const appointment2 = this.createAppointment({ 
      timeSlot: conflictingTimeSlot,
      patient: this.createPatientInfo({ patientId: 'PAT-202412-002' })
    });

    return { appointment1, appointment2 };
  }

  /**
   * Create appointment with Vietnamese healthcare specific data
   */
  static createVietnameseHealthcareAppointment(): Appointment {
    return this.createAppointment({
      patient: this.createPatientInfo({
        fullName: 'Nguyễn Thị Hồng Nhung',
        phone: '0987654321',
        nationalId: '123456789012',
        insuranceNumber: 'VN1234567890123',
        insuranceType: 'BHYT',
        address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM'
      }),
      provider: this.createProviderInfo({
        fullName: 'Bác sĩ Chuyên khoa I Trần Văn Minh',
        specialization: 'Tim mạch can thiệp',
        licenseNumber: 'VN-TM-5678'
      }),
      details: this.createAppointmentDetails({
        reason: 'Khám sức khỏe định kỳ theo chương trình BHYT',
        symptoms: 'Đau ngực trái, khó thở khi gắng sức',
        preparationInstructions: 'Nhịn ăn 12 tiếng, mang theo thẻ BHYT và CMND',
        specialRequirements: ['wheelchair_access', 'interpreter_vietnamese']
      })
    });
  }

  /**
   * Create emergency appointment
   */
  static createEmergencyAppointment(): Appointment {
    return this.createAppointment({
      appointmentId: this.createAppointmentId({
        type: AppointmentType.EMERGENCY,
        priority: AppointmentPriority.EMERGENCY
      }),
      timeSlot: this.createTimeSlot({
        startTime: new Date(), // Now
        endTime: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      }),
      details: this.createAppointmentDetails({
        reason: 'Cấp cứu tim mạch',
        urgencyLevel: 'emergency',
        reasonCode: AppointmentReason.EMERGENCY,
        symptoms: 'Đau ngực dữ dội, khó thở, choáng váng',
        requiresPreparation: false
      })
    });
  }
}
