/**
 * Get Recovery History Use Case
 * Retrieves account recovery attempt history for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query Pattern
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IRecoveryHistoryRepository } from '../../domain/repositories/IRecoveryHistoryRepository';
import { ILogger } from '../services/ILogger';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
export interface GetRecoveryHistoryRequest {
    userId: string;
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
}
export interface GetRecoveryHistoryResponse {
    success: boolean;
    history?: Array<{
        id: string;
        recoveryMethod: string;
        recoveryMethodVietnamese: string;
        attemptType: string;
        attemptTypeVietnamese: string;
        success: boolean;
        failureReason: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        attemptedAt: string;
        description: string;
    }>;
    pagination?: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
    message?: string;
    error?: string;
}
/**
 * Get Recovery History Use Case
 * Query use case to retrieve user's recovery attempt history
 */
export declare class GetRecoveryHistoryUseCase implements IUseCase<GetRecoveryHistoryRequest, GetRecoveryHistoryResponse> {
    private recoveryHistoryRepository;
    private logger;
    private circuitBreaker;
    private readonly DEFAULT_PAGE_SIZE;
    private readonly MAX_PAGE_SIZE;
    private readonly DEFAULT_HISTORY_DAYS;
    constructor(recoveryHistoryRepository: IRecoveryHistoryRepository, logger: ILogger, circuitBreaker: ICircuitBreaker);
    execute(request: GetRecoveryHistoryRequest): Promise<GetRecoveryHistoryResponse>;
    private executeImpl;
    /**
     * Validate and normalize page size
     */
    private validatePageSize;
    /**
     * Parse start date or default to 90 days ago
     */
    private parseStartDate;
    /**
     * Parse end date or default to now
     */
    private parseEndDate;
}
//# sourceMappingURL=GetRecoveryHistoryUseCase.d.ts.map