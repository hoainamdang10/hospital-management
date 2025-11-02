/**
 * Leave Queue Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IAuthorizationService, AuthorizationError } from '../services/IAuthorizationService';

export interface LeaveQueueRequest {
  patientId: string;
  doctorId: string; // Need to know which doctor's queue
  reason?: string;
  leftBy: string;
}

export interface LeaveQueueResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * Leave Queue Use Case
 * 
 * Business Rules:
 * 1. Patient can leave queue voluntarily
 * 2. Removes patient from queue
 * 3. Reorders remaining patients
 * 4. Recalculates wait times
 */
export class LeaveQueueUseCase extends BaseHealthcareUseCase<
  LeaveQueueRequest,
  LeaveQueueResponse
> {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: LeaveQueueRequest
  ): Promise<LeaveQueueResponse> {
    try {
      // 1. Authorization check
      const canLeave = await this.authorizationService.canLeaveQueue(
        request.leftBy,
        request.patientId
      );

      if (!canLeave) {
        throw new AuthorizationError(
          'You are not authorized to remove this patient from queue',
          request.leftBy,
          'leave_queue',
          request.patientId
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
          message: 'Không tìm thấy hàng chờ',
          errors: ['Queue not found']
        };
      }

      // 2. Check if patient is in queue
      if (!queue.hasPatient(request.patientId)) {
        return {
          success: false,
          message: 'Bệnh nhân không có trong hàng chờ',
          errors: ['Patient not in queue']
        };
      }

      // 3. Remove patient (Queue Aggregate handles reordering)
      const reason = request.reason || 'Patient left queue';
      queue.removePatient(request.patientId, reason, request.leftBy);

      // 4. Save queue aggregate
      await this.queueRepository.save(queue);

      return {
        success: true,
        message: 'Đã rời khỏi hàng chờ'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Không thể rời khỏi hàng chờ',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async authorize(request: LeaveQueueRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.canLeaveQueue()
    return !!userId;
  }

  involvesPHI(request: LeaveQueueRequest): boolean {
    return true;
  }

  getPatientId(request: LeaveQueueRequest): string | null {
    return request.patientId;
  }
}

