/**
 * Supabase Queue Repository - Infrastructure Layer
 * V3 Clean Architecture + DDD Implementation
 * 
 * Refactored to work with Queue Aggregate
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { Queue } from '../../domain/aggregates/Queue.aggregate';
import { QueueEntry, QueueStatus, QueuePriority } from '../../domain/entities/QueueEntry.entity';

export class SupabaseQueueRepository implements IQueueRepository {
  private supabase: SupabaseClient<any, any, any>;
  private readonly queuesTable = 'queues';
  private readonly entriesTable = 'queue_entries';

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

  /**
   * Save Queue Aggregate (persist entire aggregate with all entries)
   */
  async save(queue: Queue): Promise<void> {
    try {
      // 1. Save queue aggregate root
      // Note: 'id' is UUID auto-generated, 'queue_id' is the business key
      const queueRow = {
        queue_id: queue.id, // Business key (e.g., 'QUEUE-DOC123-2024-01-15')
        doctor_id: queue.doctorId,
        date: queue.date.toISOString().split('T')[0], // YYYY-MM-DD
        created_at: queue.createdAt.toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: queueError } = await this.supabase
        .from(this.queuesTable)
        .upsert(queueRow, { onConflict: 'queue_id' });

      if (queueError) {
        throw new Error(`Failed to save queue: ${queueError.message}`);
      }

      // 2. Get current entries from DB
      const { data: existingEntries } = await this.supabase
        .from(this.entriesTable)
        .select('id')
        .eq('queue_id', queue.id);

      const existingIds = new Set((existingEntries || []).map((e: any) => e.id));

      // 3. Save all queue entries
      const entries = queue['entries']; // Access private field
      const entryRows = entries.map((entry: QueueEntry) => ({
        id: entry.id,
        queue_id: queue.id,
        patient_id: entry.patientId,
        appointment_id: entry.appointmentId || null,
        queue_number: entry.queueNumber,
        priority: entry.priority,
        status: entry.status,
        check_in_time: entry.checkInTime.toISOString(),
        called_time: entry.calledTime?.toISOString() || null,
        completed_time: entry.completedTime?.toISOString() || null,
        estimated_wait_minutes: entry.estimatedWaitMinutes || null,
        created_at: entry.createdAt.toISOString()
      }));

      if (entryRows.length > 0) {
        const { error: entriesError } = await this.supabase
          .from(this.entriesTable)
          .upsert(entryRows, { onConflict: 'id' });

        if (entriesError) {
          throw new Error(`Failed to save queue entries: ${entriesError.message}`);
        }
      }

      // 4. Delete entries that were removed from aggregate
      const currentIds = new Set(entries.map((e: QueueEntry) => e.id));
      const deletedIds = Array.from(existingIds).filter(id => !currentIds.has(id));

      if (deletedIds.length > 0) {
        const { error: deleteError } = await this.supabase
          .from(this.entriesTable)
          .delete()
          .in('id', deletedIds);

        if (deleteError) {
          throw new Error(`Failed to delete queue entries: ${deleteError.message}`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to save queue aggregate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find Queue Aggregate by ID
   */
  async findById(id: string): Promise<Queue | null> {
    try {
      // 1. Get queue aggregate root by business key (queue_id)
      const { data: queueData, error: queueError } = await this.supabase
        .from(this.queuesTable)
        .select('*')
        .eq('queue_id', id)
        .single();

      if (queueError) {
        if (queueError.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to find queue: ${queueError.message}`);
      }

      // 2. Get all queue entries
      const { data: entriesData, error: entriesError } = await this.supabase
        .from(this.entriesTable)
        .select('*')
        .eq('queue_id', id)
        .order('queue_number', { ascending: true });

      if (entriesError) {
        throw new Error(`Failed to find queue entries: ${entriesError.message}`);
      }

      // 3. Reconstitute Queue aggregate
      return this.toDomainAggregate(queueData, entriesData || []);
    } catch (error) {
      throw new Error(`Failed to find queue by id: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find Queue Aggregate by doctor and date
   */
  async findByDoctorAndDate(doctorId: string, date: Date): Promise<Queue | null> {
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

      // 1. Get queue aggregate root
      const { data: queueData, error: queueError } = await this.supabase
        .from(this.queuesTable)
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('date', dateStr)
        .single();

      if (queueError) {
        if (queueError.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to find queue: ${queueError.message}`);
      }

      // 2. Get all queue entries (use queue_id business key, not UUID)
      const { data: entriesData, error: entriesError } = await this.supabase
        .from(this.entriesTable)
        .select('*')
        .eq('queue_id', queueData.queue_id)
        .order('queue_number', { ascending: true });

      if (entriesError) {
        throw new Error(`Failed to find queue entries: ${entriesError.message}`);
      }

      // 3. Reconstitute Queue aggregate
      return this.toDomainAggregate(queueData, entriesData || []);
    } catch (error) {
      throw new Error(`Failed to find queue by doctor and date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find or create Queue Aggregate by doctor and date
   */
  async findOrCreateByDoctorAndDate(doctorId: string, date: Date): Promise<Queue> {
    try {
      // Try to find existing queue
      let queue = await this.findByDoctorAndDate(doctorId, date);

      if (!queue) {
        // Create new queue
        queue = Queue.create(doctorId, date);
        await this.save(queue);
      }

      return queue;
    } catch (error) {
      throw new Error(`Failed to find or create queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find Queue by patient ID
   * Returns the queue that contains the patient (for current day)
   */
  async findByPatient(patientId: string): Promise<Queue | null> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // 1. Find queue entry for this patient (today only)
      const { data: entryData, error: entryError } = await this.supabase
        .from(this.entriesTable)
        .select('queue_id')
        .eq('patient_id', patientId)
        .gte('check_in_time', `${today}T00:00:00`)
        .lte('check_in_time', `${today}T23:59:59`)
        .in('status', ['WAITING', 'CALLED', 'IN_PROGRESS']) // Exclude COMPLETED/CANCELLED - uppercase match
        .order('check_in_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (entryError) {
        throw new Error(`Failed to find queue entry: ${entryError.message}`);
      }

      if (!entryData) {
        return null; // Patient not in any queue today
      }

      // 2. Load the full queue aggregate
      return await this.findById(entryData.queue_id);
    } catch (error) {
      throw new Error(`Failed to find queue by patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reconstitute Queue Aggregate from database rows
   */
  private toDomainAggregate(queueRow: any, entriesRows: any[]): Queue {
    // Map entries to QueueEntry domain entities
    const entries = entriesRows.map(row => QueueEntry.reconstitute({
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      appointmentId: row.appointment_id,
      queueNumber: row.queue_number,
      priority: row.priority as QueuePriority,
      status: row.status as QueueStatus,
      checkInTime: new Date(row.check_in_time),
      calledTime: row.called_time ? new Date(row.called_time) : undefined,
      completedTime: row.completed_time ? new Date(row.completed_time) : undefined,
      estimatedWaitMinutes: row.estimated_wait_minutes,
      createdAt: new Date(row.created_at)
    }));

    // Reconstitute Queue aggregate
    return Queue.reconstitute({
      id: queueRow.queue_id, // Use business key, not UUID
      doctorId: queueRow.doctor_id,
      date: new Date(queueRow.date),
      entries,
      averageConsultationMinutes: queueRow.average_consultation_minutes || 15,
      createdAt: new Date(queueRow.created_at),
      updatedAt: queueRow.updated_at ? new Date(queueRow.updated_at) : new Date(queueRow.created_at)
    });
  }
}

