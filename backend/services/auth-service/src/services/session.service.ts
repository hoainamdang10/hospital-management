import { supabaseAdmin } from '../config/supabase';
import logger from '@hospital/shared/dist/utils/logger';

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

export class SessionService {

  /**
   * Get current session info
   */
  public async getCurrentSession(userId: string, token: string): Promise<SessionResponse> {
    try {
      // Get user info from token
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return { error: 'Invalid session' };
      }

      // Get session info from Supabase
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

    } catch (error) {
      logger.error('Get current session service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Get all active sessions for a user
   * Note: Supabase doesn't provide direct session listing, 
   * so this is a simplified implementation
   */
  public async getUserSessions(userId: string): Promise<SessionResponse> {
    try {
      // Since Supabase doesn't provide session listing,
      // we'll return basic user info and indicate active session
      const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (error || !user) {
        return { error: 'User not found' };
      }

      // Simulate session data
      const sessions = [{
        id: `session_${userId}_${Date.now()}`,
        user_id: userId,
        created_at: user.user.created_at,
        last_sign_in_at: user.user.last_sign_in_at,
        ip_address: 'Unknown', // Supabase doesn't provide this
        user_agent: 'Unknown', // Supabase doesn't provide this
        is_current: true,
        status: 'active'
      }];

      return { sessions };

    } catch (error) {
      logger.error('Get user sessions service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Revoke all sessions for a user
   */
  public async revokeAllUserSessions(userId: string): Promise<SessionResponse> {
    try {
      // Sign out user from all devices
      const { error } = await supabaseAdmin.auth.admin.signOut(userId, 'global');

      if (error) {
        logger.error('Revoke user sessions error:', error);
        return { error: 'Failed to revoke sessions' };
      }

      return { session: null };

    } catch (error) {
      logger.error('Revoke user sessions service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Get all active sessions (Admin only)
   * This is a simplified implementation since Supabase doesn't provide session listing
   */
  public async getAllSessions(options: GetSessionsOptions): Promise<SessionResponse> {
    try {
      const { page, limit, userId } = options;
      const offset = (page - 1) * limit;

      // Get users from profiles table as a proxy for active sessions
      let query = supabaseAdmin
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
        logger.error('Get all sessions error:', error);
        return { error: 'Failed to retrieve sessions' };
      }

      // Convert profiles to session-like objects
      const sessions = profiles?.map(profile => ({
        id: `session_${profile.id}_${Date.now()}`,
        user_id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at,
        last_sign_in_at: profile.last_login, // Use last_login from profiles table
        ip_address: 'Unknown',
        user_agent: 'Unknown',
        status: 'active'
      })) || [];

      // Calculate pagination
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

    } catch (error) {
      logger.error('Get all sessions service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Get session statistics
   */
  public async getSessionStats(): Promise<any> {
    try {
      // Get active users count
      const { count: activeUsers, error: activeError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeError) {
        logger.error('Get session stats error:', activeError);
        return { error: 'Failed to get session statistics' };
      }

      // Get users signed in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todaySignIns, error: todayError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', today.toISOString());

      if (todayError) {
        logger.error('Get today sign-ins error:', todayError);
      }

      return {
        active_users: activeUsers || 0,
        today_sign_ins: todaySignIns || 0,
        total_sessions: activeUsers || 0, // Simplified
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Get session stats service error:', error);
      return { error: 'Internal server error' };
    }
  }
}
