'use client';

import { supabaseClient } from '../supabase-client';

// Types for RLS operations
export interface RLSQueryOptions {
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

// Client-side RLS helpers
export class ClientRLSHelper {
  private supabase = supabaseClient;

  // Generic method to fetch data with RLS
  async fetchWithRLS<T>(
    table: string,
    options: RLSQueryOptions = {}
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      let query = this.supabase
        .from(table)
        .select(options.select || '*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (value !== null && value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error(`RLS fetch error for table ${table}:`, error);
      return { data: null, error };
    }
  }

  // Fetch user's own profile
  async fetchUserProfile() {
    return this.fetchWithRLS('profiles', {
      select: '*',
      filters: { id: (await this.supabase.auth.getUser()).data.user?.id }
    });
  }

  // Fetch user's appointments (for patients)
  async fetchUserAppointments() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    return this.fetchWithRLS('appointments', {
      select: `
        *,
        doctor:doctors(
          profile:profiles(full_name, phone_number),
          specialization,
          department:departments(name)
        ),
        patient:patients(
          profile:profiles(full_name, phone_number)
        )
      `,
      orderBy: { column: 'appointment_date', ascending: false }
    });
  }

  // Fetch doctor's appointments
  async fetchDoctorAppointments() {
    return this.fetchWithRLS('appointments', {
      select: `
        *,
        patient:patients(
          profile:profiles(full_name, phone_number),
          date_of_birth,
          gender
        )
      `,
      orderBy: { column: 'appointment_date', ascending: true }
    });
  }

  // Fetch user's medical records (for patients)
  async fetchUserMedicalRecords() {
    return this.fetchWithRLS('medical_records', {
      select: `
        *,
        doctor:doctors(
          profile:profiles(full_name),
          specialization
        )
      `,
      orderBy: { column: 'created_at', ascending: false }
    });
  }

  // Fetch user's prescriptions
  async fetchUserPrescriptions() {
    return this.fetchWithRLS('prescriptions', {
      select: `
        *,
        doctor:doctors(
          profile:profiles(full_name),
          specialization
        ),
        prescription_items:prescription_items(
          medication_name,
          dosage,
          frequency,
          duration
        )
      `,
      orderBy: { column: 'created_at', ascending: false }
    });
  }

  // Update user profile with RLS
  async updateUserProfile(updates: Record<string, any>) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    return { data, error };
  }

  // Create appointment with RLS
  async createAppointment(appointmentData: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        doctor:doctors(
          profile:profiles(full_name),
          specialization
        )
      `)
      .single();

    return { data, error };
  }

  // Cancel appointment with RLS
  async cancelAppointment(appointmentId: string, reason?: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('appointment_id', appointmentId)
      .select()
      .single();

    return { data, error };
  }
}

// Export singleton instance
export const clientRLS = new ClientRLSHelper();
