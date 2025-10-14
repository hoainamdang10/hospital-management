/**
 * SupabaseSessionRepository
 * Supabase implementation of ISessionRepository
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { UserSession } from '../../domain/entities/UserSession';
export declare class SupabaseSessionRepository implements ISessionRepository {
    private readonly supabase;
    private readonly tableName;
    constructor(supabase: SupabaseClient);
    findById(sessionId: string): Promise<UserSession | null>;
    findByToken(sessionToken: string): Promise<UserSession | null>;
    findActiveSessionsByUserId(userId: string): Promise<UserSession[]>;
    findAllSessionsByUserId(userId: string): Promise<UserSession[]>;
    create(session: UserSession): Promise<UserSession>;
    update(session: UserSession): Promise<UserSession>;
    delete(sessionId: string): Promise<void>;
    deleteAllByUserId(userId: string): Promise<number>;
    deactivate(sessionId: string): Promise<void>;
    deactivateAllExcept(userId: string, currentSessionId: string): Promise<number>;
    cleanupExpiredSessions(): Promise<number>;
    /**
     * Map database row to domain entity
     */
    private mapToDomain;
}
//# sourceMappingURL=SupabaseSessionRepository.d.ts.map