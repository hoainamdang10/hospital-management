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

export class SupabaseSessionRepository implements ISessionRepository {
  private readonly tableName = 'user_sessions';
  private readonly schema = 'auth_schema';

  constructor(private readonly supabase: SupabaseClient) {}

  async findById(sessionId: string): Promise<UserSession | null> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async findByToken(sessionToken: string): Promise<UserSession | null> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
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

  async findAllSessionsByUserId(userId: string): Promise<UserSession[]> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(row => this.mapToDomain(row));
  }

  async create(session: UserSession): Promise<UserSession> {
    const persistenceData = session.toPersistence();

    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .insert(persistenceData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async update(session: UserSession): Promise<UserSession> {
    const persistenceData = session.toPersistence();

    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .update(persistenceData)
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async delete(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .delete()
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .delete()
      .eq('user_id', userId)
      .select();

    if (error) {
      throw new Error(`Failed to delete sessions: ${error.message}`);
    }

    return data?.length || 0;
  }

  async deactivate(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to deactivate session: ${error.message}`);
    }
  }

  async deactivateAllExcept(userId: string, currentSessionId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .update({ is_active: false })
      .eq('user_id', userId)
      .neq('id', currentSessionId)
      .select();

    if (error) {
      throw new Error(`Failed to deactivate sessions: ${error.message}`);
    }

    return data?.length || 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
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
  private mapToDomain(data: any): UserSession {
    return UserSession.fromPersistenceData({
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

