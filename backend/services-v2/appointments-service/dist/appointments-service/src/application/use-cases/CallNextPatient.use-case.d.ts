/**
 * Call Next Patient Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
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
export declare class CallNextPatientUseCase extends BaseHealthcareUseCase<CallNextPatientRequest, CallNextPatientResponse> {
    private readonly queueRepository;
    private readonly authorizationService;
    constructor(queueRepository: IQueueRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: CallNextPatientRequest): Promise<CallNextPatientResponse>;
    authorize(request: CallNextPatientRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CallNextPatientRequest): boolean;
    getPatientId(request: CallNextPatientRequest): string | null;
}
//# sourceMappingURL=CallNextPatient.use-case.d.ts.map