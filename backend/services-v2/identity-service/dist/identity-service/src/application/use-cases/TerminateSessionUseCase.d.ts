/**
 * TerminateSessionUseCase
 * Use case for terminating a specific session
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
export interface TerminateSessionRequest {
    userId: string;
    sessionId: string;
}
export interface TerminateSessionResponse {
    success: boolean;
    message: string;
}
export declare class TerminateSessionUseCase {
    private readonly sessionRepository;
    constructor(sessionRepository: ISessionRepository);
    execute(request: TerminateSessionRequest): Promise<TerminateSessionResponse>;
}
//# sourceMappingURL=TerminateSessionUseCase.d.ts.map