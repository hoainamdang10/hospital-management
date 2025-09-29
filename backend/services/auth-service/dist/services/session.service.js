"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const supabase_1 = require("../config/supabase");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class SessionService {
    async getCurrentSession(userId, token) {
        try {
            const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
            if (error || !user) {
                return { error: 'Invalid session' };
            }
            const sessionInfo = {
                user_id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                app_metadata: user.app_metadata,
                user_metadata: user.user_metadata,
                aud: user.aud,
                role: user.role
            };
            return { session: sessionInfo };
        }
        catch (error) {
            logger_1.default.error('Get current session service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async getUserSessions(userId) {
        try {
            const { data: user, error } = await supabase_1.supabaseAdmin.auth.admin.getUserById(userId);
            if (error || !user) {
                return { error: 'User not found' };
            }
            const sessions = [{
                    id: `session_${userId}_${Date.now()}`,
                    user_id: userId,
                    created_at: user.user.created_at,
                    last_sign_in_at: user.user.last_sign_in_at,
                    ip_address: 'Unknown',
                    user_agent: 'Unknown',
                    is_current: true,
                    status: 'active'
                }];
            return { sessions };
        }
        catch (error) {
            logger_1.default.error('Get user sessions service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async revokeAllUserSessions(userId) {
        try {
            const { error } = await supabase_1.supabaseAdmin.auth.admin.signOut(userId, 'global');
            if (error) {
                logger_1.default.error('Revoke user sessions error:', error);
                return { error: 'Failed to revoke sessions' };
            }
            return { session: null };
        }
        catch (error) {
            logger_1.default.error('Revoke user sessions service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async getAllSessions(options) {
        try {
            const { page, limit, userId } = options;
            const offset = (page - 1) * limit;
            let query = supabase_1.supabaseAdmin
                .from('profiles')
                .select(`
          id,
          email,
          full_name,
          role,
          last_login,
          created_at,
          is_active
        `, { count: 'exact' })
                .eq('is_active', true);
            if (userId) {
                query = query.eq('id', userId);
            }
            query = query
                .range(offset, offset + limit - 1)
                .order('last_login', { ascending: false, nullsFirst: false });
            const { data: profiles, error, count } = await query;
            if (error) {
                logger_1.default.error('Get all sessions error:', error);
                return { error: 'Failed to retrieve sessions' };
            }
            const sessions = profiles?.map(profile => ({
                id: `session_${profile.id}_${Date.now()}`,
                user_id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
                created_at: profile.created_at,
                last_sign_in_at: profile.last_login,
                ip_address: 'Unknown',
                user_agent: 'Unknown',
                status: 'active'
            })) || [];
            const totalPages = Math.ceil((count || 0) / limit);
            const pagination = {
                current_page: page,
                total_pages: totalPages,
                total_items: count || 0,
                items_per_page: limit,
                has_next: page < totalPages,
                has_prev: page > 1
            };
            return { sessions, pagination };
        }
        catch (error) {
            logger_1.default.error('Get all sessions service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async getSessionStats() {
        try {
            const { count: activeUsers, error: activeError } = await supabase_1.supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            if (activeError) {
                logger_1.default.error('Get session stats error:', activeError);
                return { error: 'Failed to get session statistics' };
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todaySignIns, error: todayError } = await supabase_1.supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('last_login', today.toISOString());
            if (todayError) {
                logger_1.default.error('Get today sign-ins error:', todayError);
            }
            return {
                active_users: activeUsers || 0,
                today_sign_ins: todaySignIns || 0,
                total_sessions: activeUsers || 0,
                last_updated: new Date().toISOString()
            };
        }
        catch (error) {
            logger_1.default.error('Get session stats service error:', error);
            return { error: 'Internal server error' };
        }
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=session.service.js.map