/**
 * SupabaseProviderScheduleRepository
 * Supabase implementation of IProviderScheduleRepository
 * 
 * Bounded Context: Appointments Service
 * - Manages cached provider work schedules
 * - Updated via StaffScheduleUpdatedEvent from Provider Staff Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IProviderScheduleRepository } from '../../domain/repositories/IProviderScheduleRepository';
import { ProviderSchedule } from '../../domain/value-objects/ProviderSchedule.vo';

export class SupabaseProviderScheduleRepository implements IProviderScheduleRepository {
  private readonly supabase: SupabaseClient<any, 'appointments_schema'>;
  private readonly schema: string = 'appointments_schema';
  private readonly tableName: string = 'provider_work_schedules';

  constructor(
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'appointments_schema',
      },
      global: {
        headers: {
          'X-Client-Info': 'appointments-service',
        },
      },
    }) as SupabaseClient<any, 'appointments_schema'>;
  }

  /**
   * Find schedule by provider ID
   */
  async findByProviderId(providerId: string): Promise<ProviderSchedule | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('provider_id', providerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw new Error(`Failed to find provider schedule: ${error.message}`);
      }

      return data ? ProviderSchedule.fromPersistence(data) : null;
    } catch (error) {
      console.error('Error finding provider schedule:', error);
      throw error;
    }
  }

  /**
   * Find schedules by multiple provider IDs
   */
  async findByProviderIds(providerIds: string[]): Promise<ProviderSchedule[]> {
    try {
      if (providerIds.length === 0) {
        return [];
      }

      const { data, error} = await this.supabase
        .from(this.tableName)
        .select('*')
        .in('provider_id', providerIds);

      if (error) {
        throw new Error(`Failed to find provider schedules: ${error.message}`);
      }

      return (data || []).map(row => ProviderSchedule.fromPersistence(row));
    } catch (error) {
      console.error('Error finding provider schedules:', error);
      throw error;
    }
  }

  /**
   * Upsert (insert or update) provider schedule
   * Used by StaffScheduleUpdatedEvent handler
   */
  async upsert(schedule: ProviderSchedule): Promise<void> {
    try {
      const data = schedule.toPersistence();

      const { error } = await this.supabase
        .from(this.tableName)
        .upsert(data, {
          onConflict: 'provider_id',
          ignoreDuplicates: false
        });

      if (error) {
        throw new Error(`Failed to upsert provider schedule: ${error.message}`);
      }

      console.log(`Provider schedule upserted successfully for provider: ${schedule.providerId}`);
    } catch (error) {
      console.error('Error upserting provider schedule:', error);
      throw error;
    }
  }

  /**
   * Delete schedule by provider ID
   */
  async delete(providerId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('provider_id', providerId);

      if (error) {
        throw new Error(`Failed to delete provider schedule: ${error.message}`);
      }

      console.log(`Provider schedule deleted successfully for provider: ${providerId}`);
    } catch (error) {
      console.error('Error deleting provider schedule:', error);
      throw error;
    }
  }

  /**
   * Check if schedule exists for provider
   */
  async exists(providerId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('provider_id')
        .eq('provider_id', providerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        throw new Error(`Failed to check provider schedule existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      console.error('Error checking provider schedule existence:', error);
      return false;
    }
  }

  /**
   * Get all schedules (for admin/reporting)
   */
  async findAll(): Promise<ProviderSchedule[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to find all provider schedules: ${error.message}`);
      }

      return (data || []).map(row => ProviderSchedule.fromPersistence(row));
    } catch (error) {
      console.error('Error finding all provider schedules:', error);
      throw error;
    }
  }

  /**
   * Count total schedules
   */
  async count(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Supabase count error:', error);
        throw new Error(`Failed to count provider schedules: ${error.message || JSON.stringify(error)}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error counting provider schedules:', error);
      throw error;
    }
  }
}
