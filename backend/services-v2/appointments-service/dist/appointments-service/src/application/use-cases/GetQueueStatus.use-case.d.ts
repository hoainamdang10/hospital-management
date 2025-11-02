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
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface GetQueueStatusRequest {
    patientId?: string;
    doctorId?: string;
    requestedBy: string;
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
export declare class GetQueueStatusUseCase extends BaseHealthcareUseCase<GetQueueStatusRequest, GetQueueStatusResponse> {
    private readonly queueRepository;
    private readonly authorizationService;
    private readonly AVERAGE_CONSULTATION_MINUTES;
    constructor(queueRepository: IQueueRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: GetQueueStatusRequest): Promise<GetQueueStatusResponse>;
    /**
     * Get patient's queue status (using Queue Aggregate)
     */
    private getPatientQueueStatus;
    /**
     * Authorization helper
     */
    private authorizeQueueAccess;
    /**
     * Get doctor's queue status (using Queue Aggregate)
     */
    private getDoctorQueueStatus;
    authorize(request: GetQueueStatusRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetQueueStatusRequest): boolean;
    getPatientId(request: GetQueueStatusRequest): string | null;
}
//# sourceMappingURL=GetQueueStatus.use-case.d.ts.map