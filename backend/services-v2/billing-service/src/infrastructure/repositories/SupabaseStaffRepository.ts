/**
 * SupabaseStaffRepository - resolves staff information for Billing Service
 * Allows mapping between external staff codes (e.g. CARD-DOC-...) and UUID ids stored in provider schema.
 */

import { logger as defaultLogger } from '@infrastructure/logging/logger';
import { OptimizedSupabaseClient } from '@shared/infrastructure/database/optimized-supabase-client';

export interface StaffProfile {
  id: string;
  staff_id: string;
  user_id: string;
  staff_type: string;
  personal_info?: any;
}

export class SupabaseStaffRepository {
  private readonly schemaName = 'provider_schema';
  private readonly tableName = 'staff_profiles';

  constructor(
    private readonly supabase: OptimizedSupabaseClient,
    private readonly logger = defaultLogger
  ) {}

  /**
   * Resolve identifier to UUID (handles UUID vs domain staff_id)
   */
  async resolveStaffId(identifier: string | undefined | null): Promise<string | null> {
    if (!identifier) {
      return null;
    }

    if (this.isUUID(identifier)) {
      return identifier;
    }

    const staff = await this.findByStaffCode(identifier);
    return staff?.id ?? null;
  }

  /**
   * Find staff profile by human-readable staff code (CARD-DOC-...)
   */
  async findByStaffCode(staffCode: string): Promise<StaffProfile | null> {
    try {
      const { data, error } = await this.supabase
        .getRawClient()
        .schema(this.schemaName)
        .from(this.tableName)
        .select('id, staff_id, user_id, staff_type, personal_info')
        .eq('staff_id', staffCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as StaffProfile;
    } catch (error) {
      this.logger.error('Failed to find staff by code', {
        staffCode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
