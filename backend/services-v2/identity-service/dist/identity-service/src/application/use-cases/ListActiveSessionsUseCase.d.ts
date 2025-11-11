/**
 * ListActiveSessionsUseCase
 * Use case for listing all active sessions for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { ILogger } from "../../../../shared/application/services/logger.interface";
export interface ListActiveSessionsRequest {
    userId: string;
    currentSessionId?: string;
    accessToken?: string;
}
export interface SessionInfo {
    sessionId: string;
    deviceInfo: {
        platform?: string;
        browser?: string;
        os?: string;
        deviceType?: string;
    };
    ipAddress: string;
    location?: string;
    lastActivity: Date;
    createdAt: Date;
    isCurrent: boolean;
    expiresAt: Date;
}
export interface ListActiveSessionsResponse {
    success: boolean;
    sessions: SessionInfo[];
    totalCount: number;
}
export declare class ListActiveSessionsUseCase {
    private readonly sessionRepository;
    private readonly logger;
    constructor(sessionRepository: ISessionRepository, logger: ILogger);
    execute(request: ListActiveSessionsRequest): Promise<ListActiveSessionsResponse>;
    /**
     * Parse device info from stored data and user agent
     */
    private parseDeviceInfo;
    /**
     * Basic user agent parsing
     */
    private parseUserAgent;
    /**
     * Get location from IP address (placeholder)
     * In production, use a geolocation service
     */
    private getLocationFromIP;
}
//# sourceMappingURL=ListActiveSessionsUseCase.d.ts.map