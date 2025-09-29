export interface SessionResponse {
    session?: any;
    sessions?: any[];
    pagination?: any;
    error?: string;
}
export interface GetSessionsOptions {
    page: number;
    limit: number;
    userId?: string;
}
export declare class SessionService {
    getCurrentSession(userId: string, token: string): Promise<SessionResponse>;
    getUserSessions(userId: string): Promise<SessionResponse>;
    revokeAllUserSessions(userId: string): Promise<SessionResponse>;
    getAllSessions(options: GetSessionsOptions): Promise<SessionResponse>;
    getSessionStats(): Promise<any>;
}
//# sourceMappingURL=session.service.d.ts.map