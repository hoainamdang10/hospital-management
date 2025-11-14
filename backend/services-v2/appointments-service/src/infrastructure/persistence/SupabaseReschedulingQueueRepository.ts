/**
 * Supabase implementation of Rescheduling Queue Repository
 * Handles appointment conflict resolution with medical compliance
 */

import { 
  IReschedulingQueueRepository, 
  ReschedulingQueueEntry,
  CreateReschedulingEntryRequest,
  UpdatePatientResponseRequest,
  ReschedulingQueueQuery,
  ReschedulingStatus,
  PatientResponse,
  ReschedulingPriority
} from '../../domain/interfaces/IReschedulingQueueRepository';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseReschedulingQueueRepository implements IReschedulingQueueRepository {
  private supabase: SupabaseClient<any, any, any>;
  private readonly tableName = 'rescheduling_queue';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'appointments_schema'
      }
    });
  }

  async addToQueue(request: CreateReschedulingEntryRequest): Promise<ReschedulingQueueEntry> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          appointment_id: request.appointmentId,
          conflict_reason: request.conflictReason,
          conflict_details: request.conflictDetails || {},
          status: ReschedulingStatus.PENDING_RESCHEDULE,
          priority: request.priority || ReschedulingPriority.NORMAL,
          expires_at: request.expiresAt?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: request.createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add to rescheduling queue: ${error.message}`);
      }

      return this.mapToReschedulingQueueEntry(data);
    } catch (error) {
      throw new Error(`Error adding to rescheduling queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(entryId: string): Promise<ReschedulingQueueEntry | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', entryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to find rescheduling queue entry: ${error.message}`);
      }

      return this.mapToReschedulingQueueEntry(data);
    } catch (error) {
      throw new Error(`Error finding rescheduling queue entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByAppointmentId(appointmentId: string): Promise<ReschedulingQueueEntry | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to find rescheduling queue entry by appointment: ${error.message}`);
      }

      return this.mapToReschedulingQueueEntry(data);
    } catch (error) {
      throw new Error(`Error finding rescheduling queue entry by appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByDoctorId(doctorId: string, query?: ReschedulingQueueQuery): Promise<ReschedulingQueueEntry[]> {
    try {
      let supabaseQuery = this.supabase
        .from(this.tableName)
        .select(`
          *,
          appointments!inner(
            doctor_id,
            patient_id,
            appointment_date,
            appointment_time
          )
        `)
        .eq('appointments.doctor_id', doctorId);

      // Apply filters
      if (query?.status) {
        supabaseQuery = supabaseQuery.eq('status', query.status);
      }
      if (query?.priority) {
        supabaseQuery = supabaseQuery.eq('priority', query.priority);
      }
      if (query?.patientResponse) {
        supabaseQuery = supabaseQuery.eq('patient_response', query.patientResponse);
      }
      if (query?.expiresBefore) {
        supabaseQuery = supabaseQuery.lt('expires_at', query.expiresBefore.toISOString());
      }
      if (query?.createdAfter) {
        supabaseQuery = supabaseQuery.gte('created_at', query.createdAfter.toISOString());
      }

      // Apply ordering and pagination
      supabaseQuery = supabaseQuery
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (query?.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }
      if (query?.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 10) - 1);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        throw new Error(`Failed to find rescheduling entries by doctor: ${error.message}`);
      }

      return data.map(item => this.mapToReschedulingQueueEntry(item));
    } catch (error) {
      throw new Error(`Error finding rescheduling entries by doctor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findPendingEntries(query?: ReschedulingQueueQuery): Promise<ReschedulingQueueEntry[]> {
    try {
      let supabaseQuery = this.supabase
        .from(this.tableName)
        .select('*')
        .in('status', [
          ReschedulingStatus.PENDING_RESCHEDULE,
          ReschedulingStatus.SEARCHING_ALTERNATIVES,
          ReschedulingStatus.NOTIFIED
        ]);

      // Apply additional filters
      if (query?.priority) {
        supabaseQuery = supabaseQuery.eq('priority', query.priority);
      }
      if (query?.expiresBefore) {
        supabaseQuery = supabaseQuery.lt('expires_at', query.expiresBefore.toISOString());
      }

      supabaseQuery = supabaseQuery
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (query?.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        throw new Error(`Failed to find pending rescheduling entries: ${error.message}`);
      }

      return data.map(item => this.mapToReschedulingQueueEntry(item));
    } catch (error) {
      throw new Error(`Error finding pending rescheduling entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findExpiredEntries(): Promise<ReschedulingQueueEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .lt('expires_at', new Date().toISOString())
        .in('status', [
          ReschedulingStatus.PENDING_RESCHEDULE,
          ReschedulingStatus.SEARCHING_ALTERNATIVES,
          ReschedulingStatus.NOTIFIED
        ])
        .order('expires_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to find expired rescheduling entries: ${error.message}`);
      }

      return data.map(item => this.mapToReschedulingQueueEntry(item));
    } catch (error) {
      throw new Error(`Error finding expired rescheduling entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePatientResponse(request: UpdatePatientResponseRequest): Promise<ReschedulingQueueEntry> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          patient_response: request.patientResponse,
          patient_responded_at: new Date().toISOString(),
          resolved_by: request.respondedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.entryId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update patient response: ${error.message}`);
      }

      return this.mapToReschedulingQueueEntry(data);
    } catch (error) {
      throw new Error(`Error updating patient response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateStatus(entryId: string, status: ReschedulingStatus, updatedBy?: string): Promise<ReschedulingQueueEntry> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (updatedBy) {
        updateData.resolved_by = updatedBy;
      }

      // Set resolved_at for terminal statuses
      if ([ReschedulingStatus.COMPLETED, ReschedulingStatus.EXPIRED, ReschedulingStatus.REJECTED].includes(status)) {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update rescheduling status: ${error.message}`);
      }

      return this.mapToReschedulingQueueEntry(data);
    } catch (error) {
      throw new Error(`Error updating rescheduling status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markNotificationSent(entryId: string): Promise<ReschedulingQueueEntry> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          notification_sent: true,
          notification_sent_at: new Date().toISOString(),
          status: ReschedulingStatus.NOTIFIED,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to mark notification as sent: ${error.message}`);
      }

      return this.mapToReschedulingQueueEntry(data);
    } catch (error) {
      throw new Error(`Error marking notification as sent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async completeRescheduling(entryId: string, newAppointmentId: string, resolvedBy: string): Promise<ReschedulingQueueEntry> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          rescheduled_appointment_id: newAppointmentId,
          status: ReschedulingStatus.COMPLETED,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to complete rescheduling: ${error.message}`);
      }

      return this.mapToReschedulingQueueEntry(data);
    } catch (error) {
      throw new Error(`Error completing rescheduling: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeFromQueue(entryId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', entryId);

      if (error) {
        throw new Error(`Failed to remove from rescheduling queue: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Error removing from rescheduling queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getQueueStatistics(): Promise<{
    totalEntries: number;
    pendingReschedules: number;
    searchingAlternatives: number;
    notified: number;
    completed: number;
    expired: number;
    averageResolutionTimeHours: number;
  }> {
    try {
      // Get counts by status
      const { data: statusData, error: statusError } = await this.supabase
        .from(this.tableName)
        .select('status, created_at, resolved_at');

      if (statusError) {
        throw new Error(`Failed to get queue statistics: ${statusError.message}`);
      }

      const entries = statusData || [];
      
      // Calculate statistics
      const stats = {
        totalEntries: entries.length,
        pendingReschedules: entries.filter(e => e.status === ReschedulingStatus.PENDING_RESCHEDULE).length,
        searchingAlternatives: entries.filter(e => e.status === ReschedulingStatus.SEARCHING_ALTERNATIVES).length,
        notified: entries.filter(e => e.status === ReschedulingStatus.NOTIFIED).length,
        completed: entries.filter(e => e.status === ReschedulingStatus.COMPLETED).length,
        expired: entries.filter(e => e.status === ReschedulingStatus.EXPIRED).length,
        averageResolutionTimeHours: 0
      };

      // Calculate average resolution time
      const completedEntries = entries.filter(e => 
        e.status === ReschedulingStatus.COMPLETED && 
        e.created_at && 
        e.resolved_at
      );

      if (completedEntries.length > 0) {
        const totalTimeHours = completedEntries.reduce((sum, entry) => {
          const created = new Date(entry.created_at);
          const resolved = new Date(entry.resolved_at);
          return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        }, 0);
        
        stats.averageResolutionTimeHours = totalTimeHours / completedEntries.length;
      }

      return stats;
    } catch (error) {
      throw new Error(`Error getting queue statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapToReschedulingQueueEntry(data: any): ReschedulingQueueEntry {
    return {
      id: data.id,
      appointmentId: data.appointment_id,
      conflictReason: data.conflict_reason,
      conflictDetails: data.conflict_details || {},
      status: data.status as ReschedulingStatus,
      priority: data.priority as ReschedulingPriority,
      notificationSent: data.notification_sent || false,
      notificationSentAt: data.notification_sent_at ? new Date(data.notification_sent_at) : undefined,
      patientResponse: data.patient_response as PatientResponse | undefined,
      patientRespondedAt: data.patient_responded_at ? new Date(data.patient_responded_at) : undefined,
      rescheduledAppointmentId: data.rescheduled_appointment_id || undefined,
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      resolvedBy: data.resolved_by || undefined,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by || undefined
    };
  }
}
