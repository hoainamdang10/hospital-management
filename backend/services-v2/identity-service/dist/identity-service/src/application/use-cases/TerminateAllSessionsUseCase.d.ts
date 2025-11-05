/**
 * TerminateAllSessionsUseCase
 * Use case for terminating all sessions except the current one
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { ILogger } from "../services/ILogger";
export interface TerminateAllSessionsRequest {
    userId: string;
    currentSessionId?: string;
    accessToken?: string;
}
export interface TerminateAllSessionsResponse {
    success: boolean;
    message: string;
    terminatedCount: number;
}
export declare class TerminateAllSessionsUseCase {
    private readonly sessionRepository;
    private readonly logger;
    constructor(sessionRepository: ISessionRepository, logger: ILogger);
    execute(request: TerminateAllSessionsRequest): Promise<TerminateAllSessionsResponse>;
}
//# sourceMappingURL=TerminateAllSessionsUseCase.d.ts.map