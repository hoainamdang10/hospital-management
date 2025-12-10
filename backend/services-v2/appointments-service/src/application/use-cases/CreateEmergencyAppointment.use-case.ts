/**
 * Create Emergency Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { Appointment, AppointmentPriority, AppointmentType } from '../../domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../domain/value-objects/AppointmentId.vo';
import { TenantId } from '../../domain/value-objects/TenantId.vo';
import { TimeSlot } from '../../domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../domain/value-objects/AppointmentDetails.vo';
import { QueueEntry, QueuePriority, QueueStatus } from '../../domain/entities/QueueEntry.entity';
import { IAuthorizationService, AuthorizationError } from '../services/IAuthorizationService';

export interface CreateEmergencyAppointmentRequest {
  patientId: string;
  doctorId: string;
  appointmentType: string;
  chiefComplaint: string;
  notes?: string;
  createdBy: string;
}

export interface CreateEmergencyAppointmentResponse {
  success: boolean;
  message: string;
  appointment?: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    priority: string;
    queuePosition: number;
  };
  errors?: string[];
}

/**
 * Create Emergency Appointment Use Case
 * 
 * Business Rules:
 * 1. Skip availability check
 * 2. Override conflicts
 * 3. Highest priority in queue (EMERGENCY)
 * 4. Immediate notification to doctor
 * 5. Auto-confirm appointment
 * 6. No cancellation fee
 */
export class CreateEmergencyAppointmentUseCase extends BaseHealthcareUseCase<
  CreateEmergencyAppointmentRequest,
  CreateEmergencyAppointmentResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly queueRepository: IQueueRepository,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: CreateEmergencyAppointmentRequest
  ): Promise<CreateEmergencyAppointmentResponse> {
    try {
      // 1. Authorization check - only staff can create emergency appointments
      const canCreate = await this.authorizationService.canCreateEmergencyAppointment(
        request.createdBy
      );

      if (!canCreate) {
        throw new AuthorizationError(
          'You are not authorized to create emergency appointments',
          request.createdBy,
          'create_emergency_appointment',
          'emergency'
        );
      }

      // 2. Create appointment for immediate time (add 1 minute to avoid "past" validation)
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1); // Add 1 minute
      const appointmentDate = now.toISOString().split('T')[0];
      const appointmentTime = now.toTimeString().split(' ')[0];

      // 2. Generate appointment ID
      const appointmentId = AppointmentId.generate();

      // 3. Create time slot
      const timeSlot = TimeSlot.create(appointmentDate, appointmentTime);

      // 4. Create appointment details
      const details = AppointmentDetails.create(
        'Emergency Appointment',
        request.chiefComplaint,
        undefined, // symptoms
        request.notes,
        'EMERGENCY - Prioritize'
      );

      // 5. Create appointment with EMERGENCY priority
      const tenantId = TenantId.createDefault();
      const appointment = Appointment.create(
        appointmentId,
        tenantId,
        request.patientId,
        request.doctorId,
        timeSlot,
        30, // Default 30 minutes
        AppointmentType.EMERGENCY,
        AppointmentPriority.EMERGENCY, //  Set priority in constructor
        details,
        200000, // Default consultation fee
        request.createdBy
      );

      // Auto-confirm
      appointment.confirm(request.createdBy);

      // 5. Save appointment
      await this.appointmentRepository.save(appointment);

      // 6. Get or create queue for today
      const today = new Date(appointmentDate);
      const queue = await this.queueRepository.findOrCreateByDoctorAndDate(
        request.doctorId,
        today
      );

      // 7. Add to queue with EMERGENCY priority (Queue Aggregate handles ordering)
      const entry = queue.addPatient(
        request.patientId,
        appointmentId.value,
        QueuePriority.EMERGENCY
      );

      // 8. Save queue aggregate
      await this.queueRepository.save(queue);

      // 9. Get queue position (queueNumber is the position)
      const queuePosition = entry.queueNumber;

      // 10. Return success response
      return {
        success: true,
        message: 'Tạo lịch hẹn khẩn cấp thành công',
        appointment: {
          appointmentId: appointmentId.value,
          patientId: request.patientId,
          doctorId: request.doctorId,
          appointmentDate,
          appointmentTime,
          status: appointment.status,
          priority: 'EMERGENCY',
          queuePosition: queuePosition || 1
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Tạo lịch hẹn khẩn cấp thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async authorize(request: CreateEmergencyAppointmentRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.canCreateEmergencyAppointment()
    return !!userId;
  }

  involvesPHI(request: CreateEmergencyAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: CreateEmergencyAppointmentRequest): string | null {
    return request.patientId;
  }
}

