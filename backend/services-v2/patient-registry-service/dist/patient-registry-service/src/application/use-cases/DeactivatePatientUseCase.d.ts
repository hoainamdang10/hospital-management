/**
 * DeactivatePatientUseCase - Application Use Case
 *
 * Deactivates a patient (soft delete)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';
import { AuditService } from '../../infrastructure/audit/AuditService';
export interface DeactivatePatientRequest {
    patientId: string;
    reason: string;
    performedBy: string;
}
export interface DeactivatePatientResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        patientId: string;
        deactivatedAt: string;
    };
}
export declare class DeactivatePatientUseCase {
    private readonly patientRepository;
    private readonly eventBus;
    private readonly logger;
    private readonly auditService;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger, auditService: AuditService);
    execute(request: DeactivatePatientRequest): Promise<DeactivatePatientResponse>;
    /**
     * Publish domain events
     */
    private publishDomainEvents;
    /**
     * HIPAA audit logging for patient deactivation
     * Logs to audit_logs table via AuditService
     */
    private auditPatientDeactivation;
}
//# sourceMappingURL=DeactivatePatientUseCase.d.ts.map