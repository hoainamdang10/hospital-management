/**
 * GetPatientHistoryUseCase - Application Use Case
 *
 * Retrieves patient history including audit logs and access logs
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '@shared/application/services/logger.interface';
export interface GetPatientHistoryRequest {
    patientId: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
    eventTypes?: string[];
    requestedBy: string;
}
export interface PatientHistoryEntry {
    eventId: string;
    eventType: string;
    action: string;
    userId: string;
    userRole?: string;
    timestamp: Date;
    changes?: Record<string, any>;
    accessedFields?: string[];
    ipAddress?: string;
    userAgent?: string;
}
export interface GetPatientHistoryResponse {
    success: boolean;
    message: string;
    data?: {
        history: PatientHistoryEntry[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        };
    };
    errors?: string[];
}
export declare class GetPatientHistoryUseCase {
    private readonly patientRepository;
    private readonly logger;
    constructor(patientRepository: IPatientRepository, logger: ILogger);
    execute(request: GetPatientHistoryRequest): Promise<GetPatientHistoryResponse>;
}
//# sourceMappingURL=GetPatientHistoryUseCase.d.ts.map