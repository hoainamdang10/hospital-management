/**
 * Join Queue Use Case - Application Layer
 * Add patient to waiting queue for their appointment
 * 
 * Refactored to use Queue Aggregate for business logic
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { QueuePriority } from '../../domain/entities/QueueEntry.entity';

export interface JoinQueueRequest {
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  departmentId?: string;
  priority: 'EMERGENCY' | 'URGENT' | 'NORMAL' | 'LOW';
  checkInTime?: Date;
}

export interface JoinQueueResponse {
  success: boolean;
  message: string;
  queueEntry?: {
    queueId: string;
    queueNumber: number;
    estimatedWaitTime: number; // in minutes
    position: number;
  };
  errors?: string[];
}

/**
 * Join Queue Use Case
 * Adds a patient to the waiting queue when they check in
 * 
 * Business logic delegated to Queue Aggregate
 */
export class JoinQueueUseCase extends BaseHealthcareUseCase<
  JoinQueueRequest,
  JoinQueueResponse
> {
  constructor(
    private readonly queueRepository: IQueueRepository
  ) {
    super();
  }

  protected async executeInternal(
    request: JoinQueueRequest
  ): Promise<JoinQueueResponse> {
    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Get or create queue for today
      const today = request.checkInTime || new Date();
      const queue = await this.queueRepository.findOrCreateByDoctorAndDate(
        request.doctorId,
        today
      );

      // 3. Add patient to queue (Queue Aggregate handles all business logic)
      const priority = QueuePriority[request.priority];
      const entry = queue.addPatient(
        request.patientId,
        request.appointmentId,
        priority,
        today
      );

      // 4. Save queue aggregate (persists all changes)
      await this.queueRepository.save(queue);

      // 5. Return success response
      const positionInfo = queue.getPatientPosition(request.patientId);
      return {
        success: true,
        message: 'Đã vào hàng chờ thành công',
        queueEntry: {
          queueId: entry.id,
          queueNumber: entry.queueNumber,
          estimatedWaitTime: positionInfo?.estimatedWaitMinutes || entry.estimatedWaitMinutes || 0,
          position: positionInfo?.position || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Không thể vào hàng chờ',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private validateRequest(request: JoinQueueRequest): void {
    const errors: string[] = [];

    if (!request.patientId) errors.push('Patient ID is required');
    if (!request.doctorId) errors.push('Doctor ID is required');
    if (!request.priority) errors.push('Priority is required');

    const validPriorities = ['EMERGENCY', 'URGENT', 'NORMAL', 'LOW'];
    if (request.priority && !validPriorities.includes(request.priority)) {
      errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  async authorize(request: JoinQueueRequest, userId: string): Promise<boolean> {
    return !!userId;
  }

  involvesPHI(request: JoinQueueRequest): boolean {
    return true;
  }

  getPatientId(request: JoinQueueRequest): string | null {
    return request.patientId;
  }
}

