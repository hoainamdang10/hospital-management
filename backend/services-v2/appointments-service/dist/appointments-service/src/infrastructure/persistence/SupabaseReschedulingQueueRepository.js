"use strict";
/**
 * Supabase implementation of Rescheduling Queue Repository
 * Handles appointment conflict resolution with medical compliance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseReschedulingQueueRepository = void 0;
const IReschedulingQueueRepository_1 = require("../../domain/interfaces/IReschedulingQueueRepository");
const supabase_js_1 = require("@supabase/supabase-js");
class SupabaseReschedulingQueueRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.tableName = 'rescheduling_queue';
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            db: {
                schema: 'appointments_schema'
            }
        });
    }
    async addToQueue(request) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert({
                appointment_id: request.appointmentId,
                conflict_reason: request.conflictReason,
                conflict_details: request.conflictDetails || {},
                status: IReschedulingQueueRepository_1.ReschedulingStatus.PENDING_RESCHEDULE,
                priority: request.priority || IReschedulingQueueRepository_1.ReschedulingPriority.NORMAL,
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
        }
        catch (error) {
            throw new Error(`Error adding to rescheduling queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findById(entryId) {
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
        }
        catch (error) {
            throw new Error(`Error finding rescheduling queue entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findByAppointmentId(appointmentId) {
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
        }
        catch (error) {
            throw new Error(`Error finding rescheduling queue entry by appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findByDoctorId(doctorId, query) {
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
        }
        catch (error) {
            throw new Error(`Error finding rescheduling entries by doctor: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findPendingEntries(query) {
        try {
            let supabaseQuery = this.supabase
                .from(this.tableName)
                .select('*')
                .in('status', [
                IReschedulingQueueRepository_1.ReschedulingStatus.PENDING_RESCHEDULE,
                IReschedulingQueueRepository_1.ReschedulingStatus.SEARCHING_ALTERNATIVES,
                IReschedulingQueueRepository_1.ReschedulingStatus.NOTIFIED
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
        }
        catch (error) {
            throw new Error(`Error finding pending rescheduling entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findExpiredEntries() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .lt('expires_at', new Date().toISOString())
                .in('status', [
                IReschedulingQueueRepository_1.ReschedulingStatus.PENDING_RESCHEDULE,
                IReschedulingQueueRepository_1.ReschedulingStatus.SEARCHING_ALTERNATIVES,
                IReschedulingQueueRepository_1.ReschedulingStatus.NOTIFIED
            ])
                .order('expires_at', { ascending: true });
            if (error) {
                throw new Error(`Failed to find expired rescheduling entries: ${error.message}`);
            }
            return data.map(item => this.mapToReschedulingQueueEntry(item));
        }
        catch (error) {
            throw new Error(`Error finding expired rescheduling entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePatientResponse(request) {
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
        }
        catch (error) {
            throw new Error(`Error updating patient response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateStatus(entryId, status, updatedBy) {
        try {
            const updateData = {
                status,
                updated_at: new Date().toISOString()
            };
            if (updatedBy) {
                updateData.resolved_by = updatedBy;
            }
            // Set resolved_at for terminal statuses
            if ([IReschedulingQueueRepository_1.ReschedulingStatus.COMPLETED, IReschedulingQueueRepository_1.ReschedulingStatus.EXPIRED, IReschedulingQueueRepository_1.ReschedulingStatus.REJECTED].includes(status)) {
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
        }
        catch (error) {
            throw new Error(`Error updating rescheduling status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async markNotificationSent(entryId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update({
                notification_sent: true,
                notification_sent_at: new Date().toISOString(),
                status: IReschedulingQueueRepository_1.ReschedulingStatus.NOTIFIED,
                updated_at: new Date().toISOString()
            })
                .eq('id', entryId)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to mark notification as sent: ${error.message}`);
            }
            return this.mapToReschedulingQueueEntry(data);
        }
        catch (error) {
            throw new Error(`Error marking notification as sent: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async completeRescheduling(entryId, newAppointmentId, resolvedBy) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update({
                rescheduled_appointment_id: newAppointmentId,
                status: IReschedulingQueueRepository_1.ReschedulingStatus.COMPLETED,
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
        }
        catch (error) {
            throw new Error(`Error completing rescheduling: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async removeFromQueue(entryId) {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('id', entryId);
            if (error) {
                throw new Error(`Failed to remove from rescheduling queue: ${error.message}`);
            }
        }
        catch (error) {
            throw new Error(`Error removing from rescheduling queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getQueueStatistics() {
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
                pendingReschedules: entries.filter(e => e.status === IReschedulingQueueRepository_1.ReschedulingStatus.PENDING_RESCHEDULE).length,
                searchingAlternatives: entries.filter(e => e.status === IReschedulingQueueRepository_1.ReschedulingStatus.SEARCHING_ALTERNATIVES).length,
                notified: entries.filter(e => e.status === IReschedulingQueueRepository_1.ReschedulingStatus.NOTIFIED).length,
                completed: entries.filter(e => e.status === IReschedulingQueueRepository_1.ReschedulingStatus.COMPLETED).length,
                expired: entries.filter(e => e.status === IReschedulingQueueRepository_1.ReschedulingStatus.EXPIRED).length,
                averageResolutionTimeHours: 0
            };
            // Calculate average resolution time
            const completedEntries = entries.filter(e => e.status === IReschedulingQueueRepository_1.ReschedulingStatus.COMPLETED &&
                e.created_at &&
                e.resolved_at);
            if (completedEntries.length > 0) {
                const totalTimeHours = completedEntries.reduce((sum, entry) => {
                    const created = new Date(entry.created_at);
                    const resolved = new Date(entry.resolved_at);
                    return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
                }, 0);
                stats.averageResolutionTimeHours = totalTimeHours / completedEntries.length;
            }
            return stats;
        }
        catch (error) {
            throw new Error(`Error getting queue statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    mapToReschedulingQueueEntry(data) {
        return {
            id: data.id,
            appointmentId: data.appointment_id,
            conflictReason: data.conflict_reason,
            conflictDetails: data.conflict_details || {},
            status: data.status,
            priority: data.priority,
            notificationSent: data.notification_sent || false,
            notificationSentAt: data.notification_sent_at ? new Date(data.notification_sent_at) : undefined,
            patientResponse: data.patient_response,
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
exports.SupabaseReschedulingQueueRepository = SupabaseReschedulingQueueRepository;
//# sourceMappingURL=SupabaseReschedulingQueueRepository.js.map