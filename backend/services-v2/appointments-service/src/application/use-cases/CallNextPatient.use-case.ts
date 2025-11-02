/**
 * Call Next Patient Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IAuthorizationService, AuthorizationError } from '../services/IAuthorizationService';

export interface CallNextPatientRequest {
  doctorId: string;
  calledBy: string;
}

export interface CallNextPatientResponse {
  success: boolean;
  message: string;
  patient?: {
    queueId: string;
    patientId: string;
    queueNumber: number;
    priority: string;
    appointmentId?: string;
    calledTime: Date;
  };
  errors?: string[];
}

/**
 * Call Next Patient Use Case
 * 
 * Business Rules:
 * 1. Gets next patient from queue (priority-based)
 * 2. Updates queue status to CALLED
 * 3. Records called time
 * 4. Sends notification to patient
 * 5. Priority order: EMERGENCY > URGENT > NORMAL > LOW
 */
export class CallNextPatientUseCase extends BaseHealthcareUseCase<
  CallNextPatientRequest,
  CallNextPatientResponse
> {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: CallNextPatientRequest
  ): Promise<CallNextPatientResponse> {
    try {
      // 1. Authorization check
      const canCall = await this.authorizationService.canCallNextPatient(
        request.calledBy,
        request.doctorId
      );

      if (!canCall) {
        throw new AuthorizationError(
          'You are not authorized to call next patient',
          request.calledBy,
          'call_next_patient',
          request.doctorId
        );
      }

      // 2. Get queue for today
      const today = new Date();
      const queue = await this.queueRepository.findByDoctorAndDate(
        request.doctorId,
        today
      );

      if (!queue) {
        return {
          success: false,
          message: 'Không có hàng chờ nào cho hôm nay',
          errors: ['No queue found for today']
        };
      }

      // 2. Call next patient (Queue Aggregate handles priority logic)
      const nextPatient = queue.callNext(request.calledBy);

      if (!nextPatient) {
        return {
          success: false,
          message: 'Không có bệnh nhân trong hàng chờ',
          errors: ['No patients in queue']
        };
      }

      // 3. Save queue aggregate
      await this.queueRepository.save(queue);

      // 4. Return success response
      return {
        success: true,
        message: 'Đã gọi bệnh nhân tiếp theo',
        patient: {
          queueId: nextPatient.id,
          patientId: nextPatient.patientId,
          queueNumber: nextPatient.queueNumber,
          priority: nextPatient.priority,
          appointmentId: nextPatient.appointmentId,
          calledTime: nextPatient.calledTime!
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gọi bệnh nhân thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async authorize(request: CallNextPatientRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.canCallNextPatient()
    return !!userId;
  }

  involvesPHI(request: CallNextPatientRequest): boolean {
    return true;
  }

  getPatientId(request: CallNextPatientRequest): string | null {
    // Will be retrieved from queue
    return null;
  }
}

