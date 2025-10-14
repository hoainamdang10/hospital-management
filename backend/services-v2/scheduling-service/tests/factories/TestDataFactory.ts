/**
 * Test Data Factory - Testing Utilities
 * V2 Clean Architecture + DDD Implementation
 * Factory for creating consistent test data
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Appointment, AppointmentStatus, AppointmentType, AppointmentPriority } from '../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot, TimeSlotStatus } from '../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails, AppointmentReason } from '../../src/domain/value-objects/AppointmentDetails.vo';
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
   * Create test patient ID
   */
  static createPatientId(overrides: Partial<{
    patientId: string;
  }> = {}): string {
    return overrides.patientId || TEST_CONSTANTS.PATIENT.ID;
  }

  /**
   * Create test doctor ID
   */
  static createDoctorId(overrides: Partial<{
    doctorId: string;
  }> = {}): string {
    return overrides.doctorId || TEST_CONSTANTS.PROVIDER.ID;
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
    patientId?: string;
    doctorId?: string;
    timeSlot?: TimeSlot;
    details?: AppointmentDetails;
    durationMinutes?: number;
    type?: AppointmentType;
    priority?: AppointmentPriority;
    consultationFee?: number;
    roomId?: string;
    departmentId?: string;
    requiredEquipment?: string[];
    createdBy?: string;
    status?: AppointmentStatus;
  }> = {}): Appointment {
    const appointmentId = overrides.appointmentId || this.createAppointmentId();
    const patientId = overrides.patientId || this.createPatientId();
    const doctorId = overrides.doctorId || this.createDoctorId();
    const timeSlot = overrides.timeSlot || this.createTimeSlot();
    const details = overrides.details || this.createAppointmentDetails();
    const durationMinutes = overrides.durationMinutes || 30;
    const type = overrides.type || AppointmentType.CONSULTATION;
    const priority = overrides.priority || AppointmentPriority.ROUTINE;
    const consultationFee = overrides.consultationFee || 200000;
    const roomId = overrides.roomId || TEST_CONSTANTS.APPOINTMENT.ROOM_ID;
    const departmentId = overrides.departmentId;
    const requiredEquipment = overrides.requiredEquipment;
    const createdBy = overrides.createdBy || 'test-user';

    const appointment = Appointment.create(
      appointmentId,
      patientId,
      doctorId,
      timeSlot,
      durationMinutes,
      type,
      priority,
      details,
      consultationFee,
      createdBy,
      roomId,
      departmentId,
      requiredEquipment
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
   * Create multiple test appointments
   */
  static createMultipleAppointments(count: number, baseOverrides: any = {}): Appointment[] {
    const appointments: Appointment[] = [];

    for (let i = 0; i < count; i++) {
      const overrides = {
        ...baseOverrides,
        patientId: `PAT-202412-${String(i + 1).padStart(3, '0')}`,
        timeSlot: this.createTimeSlot({
          startTime: new Date(TEST_CONSTANTS.DATES.TOMORROW.getTime() + i * 60 * 60 * 1000),
          endTime: new Date(TEST_CONSTANTS.DATES.TOMORROW.getTime() + i * 60 * 60 * 1000 + 30 * 60 * 1000)
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

    const conflictingTimeSlot = this.createTimeSlot({
      startTime: new Date(baseTimeSlot.appointmentDate.getTime() + 15 * 60 * 1000),
      endTime: new Date(baseTimeSlot.appointmentDate.getTime() + 45 * 60 * 1000)
    });

    const appointment1 = this.createAppointment({ timeSlot: baseTimeSlot });
    const appointment2 = this.createAppointment({
      timeSlot: conflictingTimeSlot,
      patientId: 'PAT-202412-002'
    });

    return { appointment1, appointment2 };
  }

  /**
   * Create appointment with Vietnamese healthcare specific data
   */
  static createVietnameseHealthcareAppointment(): Appointment {
    return this.createAppointment({
      patientId: 'PAT-202412-001',
      doctorId: 'CARD-DOC-202412-001',
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
      type: AppointmentType.EMERGENCY,
      priority: AppointmentPriority.EMERGENCY,
      timeSlot: this.createTimeSlot({
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000)
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
