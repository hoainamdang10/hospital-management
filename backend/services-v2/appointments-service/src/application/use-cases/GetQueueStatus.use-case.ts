/**
 * Get Queue Status Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 * 
 * Refactored to use Queue Aggregate
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IAuthorizationService, AuthorizationError } from '../services/IAuthorizationService';
import { QueueStatus } from '../../domain/entities/QueueEntry.entity';

export interface GetQueueStatusRequest {
  patientId?: string;
  doctorId?: string;
  requestedBy: string; // User ID requesting the status
}

export interface GetQueueStatusResponse {
  success: boolean;
  message: string;
  queue?: {
    patientId: string;
    doctorId: string;
    queueNumber: number;
    position: number;
    priority: string;
    status: string;
    checkInTime: Date;
    estimatedWaitMinutes?: number;
    patientsAhead: number;
  };
  doctorQueue?: {
    doctorId: string;
    totalWaiting: number;
    totalCalled: number;
    totalInProgress: number;
    patients: Array<{
      patientId: string;
      queueNumber: number;
      priority: string;
      status: string;
      waitTimeMinutes: number;
    }>;
  };
  errors?: string[];
}

/**
 * Get Queue Status Use Case
 * 
 * Business Rules:
 * 1. Patient can check their position in queue
 * 2. Doctor/Staff can see all patients in queue
 * 3. Real-time position updates
 * 4. Estimated wait time calculation
 */
export class GetQueueStatusUseCase extends BaseHealthcareUseCase<
  GetQueueStatusRequest,
  GetQueueStatusResponse
> {
  private readonly AVERAGE_CONSULTATION_MINUTES = 15;

  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: GetQueueStatusRequest
  ): Promise<GetQueueStatusResponse> {
    try {
      // Authorization check
      const canView = await this.authorizeQueueAccess(request);
      if (!canView) {
        throw new AuthorizationError(
          'You are not authorized to view queue status',
          request.requestedBy,
          'view_queue_status',
          request.doctorId || request.patientId || 'unknown'
        );
      }

      // Validation: Must provide at least one identifier
      if (!request.patientId && !request.doctorId) {
        return {
          success: false,
          message: 'Vui lòng cung cấp patientId hoặc doctorId',
          errors: ['Must provide patientId or doctorId']
        };
      }

      // Patient checking their own status
      if (request.patientId) {
        return await this.getPatientQueueStatus(request.patientId, request.doctorId);
      }

      // Doctor/Staff checking queue
      if (request.doctorId) {
        return await this.getDoctorQueueStatus(request.doctorId);
      }

      return {
        success: false,
        message: 'Vui lòng cung cấp patientId hoặc doctorId',
        errors: ['Must provide patientId or doctorId']
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lấy trạng thái hàng chờ thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get patient's queue status (using Queue Aggregate)
   */
  private async getPatientQueueStatus(
    patientId: string, 
    doctorId?: string
  ): Promise<GetQueueStatusResponse> {
    let queue;

    // If doctorId provided, search by doctor and date
    if (doctorId) {
      const today = new Date();
      queue = await this.queueRepository.findByDoctorAndDate(doctorId, today);
    } else {
      // Otherwise, search by patient (finds the queue they're in)
      queue = await this.queueRepository.findByPatient(patientId);
    }

    if (!queue) {
      return {
        success: false,
        message: 'Không tìm thấy hàng chờ',
        errors: ['Queue not found']
      };
    }

    // Get doctorId from queue if not provided
    const queueDoctorId = doctorId || queue.doctorId;

    // Find patient in queue using Queue aggregate method
    const status = queue.getStatus();
    const patientEntry = status.entries.find(e => e.patientId === patientId);

    if (!patientEntry) {
      return {
        success: false,
        message: 'Bệnh nhân không có trong hàng chờ',
        errors: ['Patient not in queue']
      };
    }

    // Calculate position (index in all entries) and patients ahead
    const position = status.entries.findIndex(e => e.patientId === patientId) + 1;
    
    const patientsAhead = position > 0 ? position - 1 : 0;
    const estimatedWaitMinutes = patientsAhead * this.AVERAGE_CONSULTATION_MINUTES;

    return {
      success: true,
      message: 'Lấy trạng thái hàng chờ thành công',
      queue: {
        patientId,
        doctorId: queueDoctorId,
        queueNumber: patientEntry.queueNumber,
        position,
        priority: patientEntry.priority,
        status: patientEntry.status,
        checkInTime: patientEntry.checkInTime,
        estimatedWaitMinutes,
        patientsAhead
      }
    };
  }

  /**
   * Authorization helper
   */
  private async authorizeQueueAccess(request: GetQueueStatusRequest): Promise<boolean> {
    return await this.authorizationService.canViewQueueStatus(
      request.requestedBy,
      request.patientId,
      request.doctorId
    );
  }

  /**
   * Get doctor's queue status (using Queue Aggregate)
   */
  private async getDoctorQueueStatus(doctorId: string): Promise<GetQueueStatusResponse> {
    // Get queue for today
    const today = new Date();
    const queue = await this.queueRepository.findByDoctorAndDate(doctorId, today);

    if (!queue) {
      return {
        success: false,
        message: 'Không tìm thấy hàng chờ',
        errors: ['Queue not found']
      };
    }

    // Get status from Queue Aggregate
    const status = queue.getStatus();

    // Map to response format
    const patients = status.entries.map(entry => ({
      patientId: entry.patientId,
      queueNumber: entry.queueNumber,
      priority: entry.priority,
      status: entry.status,
      waitTimeMinutes: entry.estimatedWaitMinutes
    }));

    return {
      success: true,
      message: 'Lấy trạng thái hàng chờ thành công',
      doctorQueue: {
        doctorId,
        totalWaiting: status.totalWaiting,
        totalCalled: status.totalCalled,
        totalInProgress: status.totalInProgress,
        patients
      }
    };
  }

  async authorize(request: GetQueueStatusRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.canCallNextPatient()
    return !!userId;
  }

  involvesPHI(request: GetQueueStatusRequest): boolean {
    return true;
  }

  getPatientId(request: GetQueueStatusRequest): string | null {
    return request.patientId || null;
  }
}

