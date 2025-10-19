"use strict";
/**
 * SupabaseSessionRepository
 * Supabase implementation of ISessionRepository
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseSessionRepository = void 0;
const UserSession_1 = require("../../domain/entities/UserSession");
class SupabaseSessionRepository {
    // Note: Supabase client is already configured with db.schema = 'auth_schema'
    // So we don't need to prefix table names with schema
    constructor(supabase) {
        this.supabase = supabase;
        this.tableName = 'user_sessions';
    }
    async findById(sessionId) {
        const { data, error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .select('*')
            .eq('id', sessionId)
            .eq('is_active', true) // Only return active sessions
            .single();
        if (error || !data) {
            return null;
        }
        return this.mapToDomain(data);
    }
    async findByToken(sessionToken) {
        const { data, error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .select('*')
            .eq('session_token', sessionToken)
            .single();
        if (error || !data) {
            return null;
        }
        return this.mapToDomain(data);
    }
    async findActiveSessionsByUserId(userId) {
        const { data, error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .order('last_accessed_at', { ascending: false });
        if (error || !data) {
            return [];
        }
        return data.map(row => this.mapToDomain(row));
    }
    async findAllSessionsByUserId(userId) {
        const { data, error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .select('*')
            .eq('user_id', userId)
            .order('last_accessed_at', { ascending: false });
        if (error || !data) {
            return [];
        }
        return data.map(row => this.mapToDomain(row));
    }
    async create(session) {
        const persistenceData = session.toPersistence();
        const { data, error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .insert(persistenceData)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create session: ${error.message}`);
        }
        return this.mapToDomain(data);
    }
    async update(session) {
        const persistenceData = session.toPersistence();
        const { data, error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .update(persistenceData)
            .eq('id', session.id)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update session: ${error.message}`);
        }
        return this.mapToDomain(data);
    }
    async delete(sessionId) {
        const { error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .delete()
            .eq('id', sessionId);
        if (error) {
            throw new Error(`Failed to delete session: ${error.message}`);
        }
    }
    async deleteAllByUserId(userId) {
        const { data, error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .delete()
            .eq('user_id', userId)
            .select();
        if (error) {
            throw new Error(`Failed to delete sessions: ${error.message}`);
        }
        return data?.length || 0;
    }
    async deactivate(sessionId) {
        const { error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .update({ is_active: false })
            .eq('id', sessionId);
        if (error) {
            throw new Error(`Failed to deactivate session: ${error.message}`);
        }
    }
    async deactivateAllExcept(userId, currentSessionId) {
        const { data, error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .update({ is_active: false })
            .eq('user_id', userId)
            .neq('id', currentSessionId)
            .select();
        if (error) {
            throw new Error(`Failed to deactivate sessions: ${error.message}`);
        }
        return data?.length || 0;
    }
    async cleanupExpiredSessions() {
        const { data, error } = await this.supabase
            .from(this.tableName) // Supabase client already configured with schema
            .delete()
            .lt('expires_at', new Date().toISOString())
            .select();
        if (error) {
            throw new Error(`Failed to cleanup expired sessions: ${error.message}`);
        }
        return data?.length || 0;
    }
    /**
     * Map database row to domain entity
     */
    mapToDomain(data) {
        return UserSession_1.UserSession.fromPersistenceData({
            id: data.id,
            userId: data.user_id,
            sessionToken: data.session_token,
            deviceInfo: data.device_info,
            ipAddress: data.ip_address,
            userAgent: data.user_agent,
            expiresAt: new Date(data.expires_at),
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            lastAccessedAt: new Date(data.last_accessed_at)
        });
    }
}
exports.SupabaseSessionRepository = SupabaseSessionRepository;
//# sourceMappingURL=SupabaseSessionRepository.js.map