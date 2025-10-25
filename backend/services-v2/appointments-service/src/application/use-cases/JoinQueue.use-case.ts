/**
 * Join Queue Use Case - Application Layer
 * Add patient to waiting queue for their appointment
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';

export interface JoinQueueRequest {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  departmentId?: string;
  priority: number; // 0 = normal, 1 = high, 2 = urgent, 3 = emergency
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
 */
export class JoinQueueUseCase extends BaseHealthcareUseCase<
  JoinQueueRequest,
  JoinQueueResponse
> {
  protected async executeInternal(
    request: JoinQueueRequest
  ): Promise<JoinQueueResponse> {
    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Check if patient is already in queue
      // TODO: Implement repository check

      // 3. Get current queue position
      const currentQueue = await this.getCurrentQueueCount(request.doctorId);
      const queueNumber = currentQueue + 1;

      // 4. Calculate estimated wait time
      const estimatedWaitTime = this.calculateEstimatedWaitTime(
        currentQueue,
        request.priority
      );

      // 5. Create queue entry
      const queueId = `QUEUE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // TODO: Save to repository

      return {
        success: true,
        message: 'Đã vào hàng chờ thành công',
        queueEntry: {
          queueId,
          queueNumber,
          estimatedWaitTime,
          position: queueNumber,
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

    if (!request.appointmentId) errors.push('Appointment ID is required');
    if (!request.patientId) errors.push('Patient ID is required');
    if (!request.doctorId) errors.push('Doctor ID is required');

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  private async getCurrentQueueCount(doctorId: string): Promise<number> {
    // TODO: Query repository for current queue count
    return 0;
  }

  private calculateEstimatedWaitTime(
    currentQueueSize: number,
    priority: number
  ): number {
    // Average consultation time: 15 minutes
    const avgConsultationTime = 15;

    // Priority patients get reduced wait time
    const priorityMultiplier = priority >= 2 ? 0.5 : 1.0;

    return Math.floor(currentQueueSize * avgConsultationTime * priorityMultiplier);
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

