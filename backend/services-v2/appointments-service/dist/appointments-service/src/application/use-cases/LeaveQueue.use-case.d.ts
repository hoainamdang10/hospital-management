/**
 * Leave Queue Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface LeaveQueueRequest {
    patientId: string;
    doctorId: string;
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
export declare class LeaveQueueUseCase extends BaseHealthcareUseCase<LeaveQueueRequest, LeaveQueueResponse> {
    private readonly queueRepository;
    private readonly authorizationService;
    constructor(queueRepository: IQueueRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: LeaveQueueRequest): Promise<LeaveQueueResponse>;
    authorize(request: LeaveQueueRequest, userId: string): Promise<boolean>;
    involvesPHI(request: LeaveQueueRequest): boolean;
    getPatientId(request: LeaveQueueRequest): string | null;
}
//# sourceMappingURL=LeaveQueue.use-case.d.ts.map