/**
 * Join Queue Use Case - Application Layer
 * Add patient to waiting queue for their appointment
 *
 * Refactored to use Queue Aggregate for business logic
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
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
        estimatedWaitTime: number;
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
export declare class JoinQueueUseCase extends BaseHealthcareUseCase<JoinQueueRequest, JoinQueueResponse> {
    private readonly queueRepository;
    constructor(queueRepository: IQueueRepository);
    protected executeInternal(request: JoinQueueRequest): Promise<JoinQueueResponse>;
    private validateRequest;
    authorize(request: JoinQueueRequest, userId: string): Promise<boolean>;
    involvesPHI(request: JoinQueueRequest): boolean;
    getPatientId(request: JoinQueueRequest): string | null;
}
//# sourceMappingURL=JoinQueue.use-case.d.ts.map