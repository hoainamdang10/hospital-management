/**
 * Schedule Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD + CQRS Implementation
 * Matches domain model V3 (only stores IDs, not denormalized data)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { Appointment, AppointmentType, AppointmentPriority } from '../../domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../domain/value-objects/AppointmentDetails.vo';
import { TenantId } from '../../domain/value-objects/TenantId.vo';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

export interface ScheduleAppointmentRequest {
  // Multi-tenancy
  tenantId?: string; // Optional, defaults to 'hospital-1'

  // Only IDs - no denormalized data
  patientId: string;
  doctorId: string;

  // Appointment time
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM:SS
  durationMinutes: number;

  // Appointment type and priority
  type: AppointmentType;
  priority: AppointmentPriority;

  // Clinical details
  reason?: string;
  chiefComplaint?: string;
  symptoms?: string[];
  notes?: string;
  specialInstructions?: string;

  // Optional fields
  roomId?: string;
  departmentId?: string;
  requiredEquipment?: string[];

  // Billing
  consultationFee: number;

  // System
  createdBy: string;
}

export interface ScheduleAppointmentResponse {
  success: boolean;
  appointmentId: string;
  message: string;
  appointment?: {
    id: string;
    appointmentId: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes: number;
    type: string;
    priority: string;
    status: string;
    consultationFee: number;
  };
  errors?: string[];
}

/**
 * Schedule Appointment Use Case
 * Creates a new appointment with proper validation and business rules
 */
export class ScheduleAppointmentUseCase extends BaseHealthcareUseCase<
  ScheduleAppointmentRequest,
  ScheduleAppointmentResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {
    super();
  }

  /**
   * Execute use case
   */
  protected async executeInternal(
    request: ScheduleAppointmentRequest
  ): Promise<ScheduleAppointmentResponse> {
    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Create value objects
      const appointmentId = AppointmentId.generate();
      const tenantId = request.tenantId
        ? TenantId.create(request.tenantId)
        : TenantId.createDefault();

      const timeSlot = TimeSlot.create(
        request.appointmentDate,
        request.appointmentTime
      );
      const details = AppointmentDetails.create(
        request.reason,
        request.chiefComplaint,
        request.symptoms,
        request.notes,
        request.specialInstructions
      );

      // 3. Create appointment aggregate
      const appointment = Appointment.create(
        appointmentId,
        tenantId,
        request.patientId,
        request.doctorId,
        timeSlot,
        request.durationMinutes,
        request.type,
        request.priority,
        details,
        request.consultationFee,
        request.createdBy,
        request.roomId,
        request.departmentId,
        request.requiredEquipment
      );

      // 4. Save to repository
      await this.appointmentRepository.save(appointment);

      // 5. Return response
      return {
        success: true,
        appointmentId: appointmentId.value,
        message: 'Đặt lịch hẹn thành công',
        appointment: {
          id: appointment.id,
          appointmentId: appointmentId.value,
          patientId: request.patientId,
          doctorId: request.doctorId,
          appointmentDate: request.appointmentDate,
          appointmentTime: request.appointmentTime,
          durationMinutes: request.durationMinutes,
          type: request.type,
          priority: request.priority,
          status: 'scheduled',
          consultationFee: request.consultationFee
        }
      };
    } catch (error) {
      return {
        success: false,
        appointmentId: '',
        message: 'Đặt lịch hẹn thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: ScheduleAppointmentRequest): void {
    const errors: string[] = [];

    if (!request.patientId) {
      errors.push('Patient ID is required');
    }

    if (!request.doctorId) {
      errors.push('Doctor ID is required');
    }

    if (!request.appointmentDate) {
      errors.push('Appointment date is required');
    }

    if (!request.appointmentTime) {
      errors.push('Appointment time is required');
    }

    if (!request.durationMinutes || request.durationMinutes <= 0) {
      errors.push('Duration must be positive');
    }

    if (!request.type) {
      errors.push('Appointment type is required');
    }

    if (!request.priority) {
      errors.push('Priority is required');
    }

    if (request.consultationFee < 0) {
      errors.push('Consultation fee cannot be negative');
    }

    if (!request.createdBy) {
      errors.push('Created by is required');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * Authorization check
   */
  async authorize(request: ScheduleAppointmentRequest, userId: string): Promise<boolean> {
    // Only authenticated users can schedule appointments
    return !!userId;
  }

  /**
   * Check if involves PHI
   */
  involvesPHI(request: ScheduleAppointmentRequest): boolean {
    return true; // Appointment data is PHI
  }

  /**
   * Get patient ID
   */
  getPatientId(request: ScheduleAppointmentRequest): string | null {
    return request.patientId;
  }
}

